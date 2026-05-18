# Sessionly — Backend Endpoints to Implement

> Canonical list of HTTP endpoints the backend must expose to satisfy the client roadmap (`sessionly-client/docs/business/screens-roadmap.docs.md`). Grouped by domain module, mirroring the client's `src/api/*` structure. Each row states the method, path, auth, request, response, and the business rules the implementation must enforce.
>
> **Status legend:** ✅ shipped · 🚧 partial · ❌ not started.

---

## Conventions

- All paths prefixed with `/api` (Nest controller global prefix).
- Authentication: `Bearer <jwt>` in `Authorization` header. JWT issued by `POST /auth/login`. Server is authoritative for all role/ownership checks — never trust client-side role claims.
- Money is in **minor units (cents)** end-to-end. Currency is a server-controlled field; do not let the client send it.
- Timestamps are ISO-8601 UTC. The client renders in user's IANA timezone (stored in `User.timezone`).
- Pagination follows the `core/PaginationParams` + `PaginatedResult<T>` shape already used by `User`. Default `page=1`, `pageSize=20`.
- Errors return the `AppError` shape mapped by `HttpExceptionFilter`:
  ```json
  { "statusCode": 409, "errorCode": "EMAIL_ALREADY_EXISTS", "message": "..." }
  ```
- Validation errors: `400 INVALID_INPUT` with a `details` array per field.

---

## 1. Auth (`/auth`)

| Status | Method | Path | Auth | Purpose |
|---|---|---|---|---|
| ✅ | `POST` | `/auth/login` | none | Credentials login. Returns `{ accessToken, refreshToken, user }`. |
| ❌ | `POST` | `/auth/refresh` | refresh token | Issue a new `accessToken` (and rotate refresh). |
| ❌ | `POST` | `/auth/logout` | yes | Revoke current refresh token (server-side). |
| ❌ | `POST` | `/auth/forgot-password` | none | Always returns `204` (do **not** leak whether email exists). Sends reset email if account exists. |
| ❌ | `POST` | `/auth/reset-password` | none | Body: `{ token, newPassword }`. Validates emailed token, rotates password, invalidates other refresh tokens. |

### Rules
- Access-token expiry: 15 min. Refresh-token expiry: 30 days, rotation on every use, single-use, stored hashed.
- Reset tokens: single-use, 30-min expiry, hashed at rest. After successful reset, revoke all existing refresh tokens for the user.
- Rate-limit `/auth/login`, `/auth/forgot-password`, `/auth/reset-password` per IP + per email.

---

## 2. User (`/users`)

| Status | Method | Path | Auth | Purpose |
|---|---|---|---|---|
| ✅ | `POST` | `/users` | none | Register. Body distinguishes MENTOR vs CLIENT via discriminated payload (`mentorProfile` or `clientProfile`). Auto-logs in client side via subsequent `/auth/login`. |
| ✅ | `GET` | `/users/me` | yes | Return the signed-in user with role-specific profile + computed `profileComplete` flag. |
| ✅ | `PATCH` | `/users/me` | yes | Update `name`, `bio`, `avatarUrl`, `links`, `activityStatus`, role-specific profile fields. |
| ✅ | `PATCH` | `/users/me/password` | yes | Body: `{ currentPassword, newPassword }`. Revokes all refresh tokens except the current session. |
| ✅ | `DELETE` | `/users/me` | yes | Soft-delete with a 7-day window. Returns `{ deletionScheduledAt }`. Cancellable via `POST /users/me/restore`. |
| ✅ | `POST` | `/users/me/restore` | yes | Cancel pending soft-delete within the 7-day window. |
| ✅ | `POST` | `/users/me/avatar` | yes | Multipart upload. Validates mime/size, strips EXIF, stores in S3, returns `{ url }`. Max 5 MB; allowed: `image/jpeg`, `image/png`, `image/webp`. |

### `profileComplete` rule
A mentor is `profileComplete=true` iff: `bio` set, `avatarUrl` set, `mentorProfile.specialties.length >= 1`, `mentorProfile.chatPrice > 0`, and at least one active availability slot in the next 30 days. Compute server-side; never trust client.

### Rules
- Hard-delete the soft-deleted row after 7 days via a scheduled job. Cascade per FK rules (see entities doc).
- Email is unique and case-insensitive (`citext` or normalize before storage).

---

## 3. Mentor — public read surface (`/mentors`)

| Status | Method | Path | Auth | Purpose |
|---|---|---|---|---|
| ❌ | `GET` | `/mentors` | none | Public directory. Query: `q` (search), `niche`, `specialties[]`, `minPrice`, `maxPrice`, `minRating`, `availabilityWithinDays`, `page`, `pageSize`. Returns only mentors with `profileComplete=true`. |
| ❌ | `GET` | `/mentors/:id` | none | Public profile: user fields + `mentorProfile` + aggregated rating + recent reviews count + next-7-days availability preview. |
| ❌ | `GET` | `/mentors/:id/availability` | none | Full availability for booking: recurring rules + concrete slots within `from`–`to` query range. |
| ❌ | `GET` | `/mentors/:id/reviews` | none | Paginated reviews (received). |

### Rules
- `/mentors` results must exclude soft-deleted, `INACTIVE`, or incomplete-profile users.
- Use a uuid `:id` for MVP. Slug support is an open question (entities + URL).

---

## 4. Availability (`/availability`) — mentor-authenticated

| Status | Method | Path | Auth | Purpose |
|---|---|---|---|---|
| ❌ | `GET` | `/availability/me` | yes (mentor) | Recurring rules + ad-hoc slots for the signed-in mentor. |
| ❌ | `PUT` | `/availability/rules` | yes (mentor) | Replace the recurring weekly rules. Body: `{ rules: { weekday, startTime, endTime, slotDurationMin }[] }`. |
| ❌ | `POST` | `/availability/slots` | yes (mentor) | Create one or more ad-hoc slots (overrides). |
| ❌ | `DELETE` | `/availability/slots/:slotId` | yes (mentor) | Delete an ad-hoc slot. Reject if a `BookingRequest` references it. |

### Rules
- Server materializes concrete slots from rules + overrides for a queried date range. Booked slots become unavailable.
- All times stored UTC; client sends ISO-8601 with offset, server normalizes.
- "Vacation mode" is not a separate concept — mentor removes/disables slots for the desired range. No `vacation` endpoint.

---

## 5. Booking Request (`/bookings`)

Two-step lifecycle separated from `Session`: a `BookingRequest` is created on client submit, accepted by the mentor, then paid by the client to produce a `Session`.

States: `PENDING` → `AWAITING_PAYMENT` | `DECLINED` | `EXPIRED`; `AWAITING_PAYMENT` → `PAID` (produces `Session`) | `EXPIRED`.

| Status | Method | Path | Auth | Purpose |
|---|---|---|---|---|
| ❌ | `POST` | `/bookings` | yes (client) | Create request. Body: `{ mentorId, slotStart, slotEnd, messageToMentor? }`. **No charge yet.** Status `PENDING`. Auto-expire in 24h. |
| ❌ | `GET` | `/bookings/requests` | yes (mentor) | Mentor's incoming requests, filterable by status. |
| ❌ | `GET` | `/bookings/mine` | yes (client) | Client's outgoing requests. |
| ❌ | `PATCH` | `/bookings/:id/accept` | yes (mentor) | Move `PENDING` → `AWAITING_PAYMENT`. Triggers notification to client; locks the slot soft-hold. Auto-expire in 24h if unpaid. |
| ❌ | `PATCH` | `/bookings/:id/decline` | yes (mentor) | Body: `{ reason? }`. Notifies client. Nothing to refund (no charge yet). |

### Rules
- A request can only be created for a slot that is currently free and within the mentor's availability.
- Soft-hold the slot at `AWAITING_PAYMENT` so it's not double-bookable.
- Auto-expiry job moves stale requests to `EXPIRED` and releases the soft-hold.
- A session is created only when the `AWAITING_PAYMENT` → `PAID` transition fires (driven by the payment success webhook).

---

## 6. Session (`/sessions`)

| Status | Method | Path | Auth | Purpose |
|---|---|---|---|---|
| ❌ | `GET` | `/sessions` | yes | List participant's sessions. Query: `status`, `from`, `to`, `page`, `pageSize`. Backend filters by JWT subject. |
| ❌ | `GET` | `/sessions/:id` | yes (participant) | Detail. Includes payment status, refundable amount under current policy, and a signed Jitsi room token. |
| ❌ | `POST` | `/sessions/:id/cancel` | yes (participant) | Apply refund policy (>24h → full refund; <24h → forfeit; server is source of truth). Refund debits escrow. Sets status `CANCELLED`. |
| ❌ | `PATCH` | `/sessions/:id/reschedule` | yes (participant) | Body: `{ newSlotStart, newSlotEnd }`. Validates against availability + 24h policy. May trigger partial refund + new charge depending on price delta. |
| ❌ | `POST` | `/sessions/:id/no-show` | yes (participant) | Body: `{ flaggedRole: 'MENTOR'\|'CLIENT'\|'BOTH', note? }`. Submission window: from end-time up to 24h after. Server arbitrates: client no-show → release to mentor; mentor no-show → full refund + reliability flag (3 in 90 days → suspend listing). |
| ❌ | `GET` | `/sessions/:id/ics` | yes (participant) | Signed `.ics` download; short-lived URL token. |

### Rules
- `Session` is the post-paid artifact; creation is internal (driven by payment success), not a public POST.
- Room link is active from `start-10min` to `end+15min` only.
- After `endTime + 30min` with both participants having joined, auto-transition to `COMPLETED` and emit `session.completed` event (triggers payout release).

---

## 7. Payment (`/payments`)

Two product types:

- `SESSION` — escrow. Captured at the `AWAITING_PAYMENT` → `PAID` transition, **held** until session `COMPLETED`, then released to mentor.
- `CHAT` — one-shot. Captured immediately on purchase, no escrow.

| Status | Method | Path | Auth | Purpose |
|---|---|---|---|---|
| ❌ | `POST` | `/payments/intent` | yes | Body: `{ type: 'SESSION'\|'CHAT', targetId }` where `targetId` is a `BookingRequest.id` (SESSION) or `mentorId` (CHAT). Returns `{ paymentId, clientSecret }` for Stripe Elements. |
| ❌ | `GET` | `/payments` | yes | List the caller's payments. Mentors see incoming; clients see outgoing. Query: `status`, `from`, `to`, `page`, `pageSize`. |
| ❌ | `GET` | `/payments/:id` | yes (owner) | Detail with status (`PENDING`, `HELD`, `RELEASED`, `REFUNDED`, `FAILED`), refundable amount, receipt URL. |
| ❌ | `POST` | `/payments/:id/refund` | yes (admin or policy auto) | Refund up to remaining held amount. Used by cancellation + dispute paths. |
| ❌ | `POST` | `/payments/webhook` | Stripe sig | Stripe webhook: `payment_intent.succeeded` → transitions `BookingRequest`/`Chat`; `payment_intent.payment_failed` → notify client. |

### Rules
- `release` of a `SESSION` payment is **server-internal only**, triggered by `session.completed` event. Not a public endpoint.
- Until Stripe Connect lands, the platform holds funds in an internal ledger; mentor payouts are off-band. Document `HELD` vs `RELEASED` states accurately so the client can render `BillingPage` and `EarningsPage` correctly.
- Webhook idempotency: store the Stripe event id and dedupe.

> **OBS:** Stripe Connect + KYC, tax/VAT, multi-currency are deferred but the API surface above is shaped to accommodate them without breaking changes.

---

## 8. Chat (`/chats`) + Message (`/chats/:id/messages`)

| Status | Method | Path | Auth | Purpose |
|---|---|---|---|---|
| ❌ | `GET` | `/chats` | yes | Caller's chats, sorted by `lastMessageAt` desc. Includes unread counts. |
| ❌ | `GET` | `/chats/:id` | yes (participant) | Chat metadata. |
| ❌ | `POST` | `/chats` | yes (client) | Body: `{ mentorId }`. Creates a `Chat` only after a successful `CHAT`-type payment intent. Returns existing chat if one already exists. |
| ❌ | `GET` | `/chats/:id/messages` | yes (participant) | Paginated, cursor-based, newest-first; `before` cursor for history scroll-up. |
| ❌ | `POST` | `/chats/:id/messages` | yes (participant) | Body: `{ body }`. Server timestamps. Emits WS event to the other participant. |
| ❌ | `POST` | `/chats/:id/read` | yes (participant) | Marks all messages up to `lastMessageId` as read by caller. |

### Rules
- Chat creation is gated by payment success — never create a chat without a settled `CHAT` payment.
- Realtime transport (WS) handshake authenticates with the same `accessToken` (query string or first-frame auth). Reconnect on disconnect with backoff.

---

## 9. Review (`/reviews`)

| Status | Method | Path | Auth | Purpose |
|---|---|---|---|---|
| ❌ | `POST` | `/sessions/:id/review` | yes (client, participant) | Body: `{ rating: 1-5, comment? }`. One review per session; idempotent. Only allowed once session is `COMPLETED`. |
| ❌ | `GET` | `/reviews/given` | yes | Reviews the caller authored. |
| ❌ | `GET` | `/reviews/received` | yes (mentor) | Reviews of the caller (mentor only). |

### Rules
- Aggregated mentor rating is denormalized on `MentorProfile` (avg + count) and updated transactionally on review write.

---

## 10. Notification (`/notifications`)

| Status | Method | Path | Auth | Purpose |
|---|---|---|---|---|
| ❌ | `GET` | `/notifications` | yes | Paginated list, newest-first. |
| ❌ | `POST` | `/notifications/:id/read` | yes (owner) | Mark single notification as read. |
| ❌ | `POST` | `/notifications/read-all` | yes | Mark all caller's notifications read. |
| ❌ | `GET` | `/notifications/preferences` | yes | Per-channel × per-event-type toggles. |
| ❌ | `PATCH` | `/notifications/preferences` | yes | Update preferences. |

### Event types to emit
`booking_request_received` (mentor), `booking_accepted` (client), `booking_declined` (client), `payment_due` (client), `payment_succeeded` (both), `session_starts_24h`, `session_starts_1h`, `session_completed`, `review_received` (mentor), `payout_released` (mentor), `refund_processed` (client).

### Rules
- Schedule `session_starts_24h` + `session_starts_1h` at booking-paid time; cancel on reschedule/cancel.
- Respect user preferences for delivery channels (in-app, email). In-app delivery is always created; email is gated.

---

## 11. Calendar sync (`/calendar`)

| Status | Method | Path | Auth | Purpose |
|---|---|---|---|---|
| ❌ | `GET` | `/calendar/providers` | yes | List supported providers + caller's connection status. |
| ❌ | `GET` | `/calendar/connect/:provider/url` | yes | Return the OAuth consent URL. |
| ❌ | `POST` | `/calendar/connect/:provider/callback` | yes | Body: `{ code }`. Exchanges + stores tokens. |
| ❌ | `DELETE` | `/calendar/connect/:provider` | yes | Disconnect; revoke tokens. |
| ❌ | `PATCH` | `/calendar/sync-mode` | yes | Body: `{ mode: 'ONE_WAY'\|'TWO_WAY' }`. ONE_WAY reads external busy windows; TWO_WAY also pushes sessions out. |

### Rules
- One-way is default once connected. Read external busy windows during availability calculation to block conflicting slots.
- Token refresh happens server-side via a background job before expiry.

---

## 12. Consent (`/consent`)

| Status | Method | Path | Auth | Purpose |
|---|---|---|---|---|
| ❌ | `POST` | `/consent` | optional | Body: `{ version, categories: { analytics, marketing, ... } }`. Stores against user when authenticated, otherwise anonymous (cookie-correlated). |
| ❌ | `GET` | `/consent` | yes | Returns current consent record + the latest policy version so the client can decide whether to re-prompt. |

---

## 13. Data export (`/data-export`) — GDPR

| Status | Method | Path | Auth | Purpose |
|---|---|---|---|---|
| ❌ | `POST` | `/data-export` | yes | Enqueue an export job. Returns `{ exportId, status: 'PENDING' }`. |
| ❌ | `GET` | `/data-export/:id` | yes (owner) | Status: `PENDING` \| `READY` \| `FAILED`. When `READY`, returns a short-lived signed URL to the ZIP. |

### Rules
- ZIP includes: profile, sessions, chats + messages, reviews, payments. Encrypt at rest.
- Throttle to 1 export per 24h per user.

---

## Cross-cutting requirements

- **Authorization:** every endpoint checks role + resource ownership server-side. Repeat: never trust client-side claims.
- **Validation:** all input via class-validator DTOs + global `ValidationPipe` (whitelist + forbidNonWhitelisted).
- **Rate limiting:** per IP + per user on auth, booking, message-send, and payment-intent endpoints.
- **Idempotency:** `POST /payments/intent`, `POST /bookings`, Stripe webhook all idempotent via either client-provided `Idempotency-Key` header or natural keys (booking + slot).
- **Observability:** request id propagation, structured logs, `payment_intent.*` events fully traced.
- **Pagination defaults:** `pageSize <= 100`; default 20.
- **Time:** server returns ISO-8601 UTC; never assume client timezone.
- **Webhooks:** verify Stripe signature; respond `200` only after persisting + enqueuing side effects.

---

## Open questions (mirrors `screens-roadmap.docs.md` §9)

1. Realtime transport — native WS vs Socket.io vs hosted (Ably/Pusher).
2. Stripe Connect vs simple Checkout + manual payouts (drives `release` mechanics).
3. Mentor public URL — uuid vs slug (impacts `GET /mentors/:id`).
4. Search infra — Postgres ILIKE for MVP vs Meili/Algolia early.
5. Chat purchase model — one-shot per mentor vs subscription.

---

## Phase mapping (for backend planning)

| Phase | Endpoints to ship |
|---|---|
| 0 | `/auth/*` extensions (refresh, logout, forgot, reset). `/users/me*`. `/consent`. |
| 1 | `/users/me` updates incl. profile-complete computation. `/users/me/avatar` (S3 upload). `/mentors`, `/mentors/:id`, `/mentors/:id/reviews`. `/data-export`. |
| 2 | `/availability/*`. `/bookings/*`. `/sessions/*` (cancel, reschedule, no-show, ics) — payment paths mocked. |
| 3 | `/payments/*` + Stripe webhook. Replace mocked payment paths in booking flow. |
| 4 | `/chats/*`, `/chats/:id/messages`. WS gateway. |
| 5 | `/sessions/:id/review`, `/reviews/*`. Jitsi room-token issuance. |
| 6 | `/notifications/*` (replaces phase-2 stub). `/calendar/*`. |
| 7 | Polish: rate limits, audit, perf. |

> **OBS — public-launch readiness (post-Phase 7):** Stripe Connect + KYC, tax/VAT, multi-currency, refund/dispute admin endpoints, email verification, user reporting/blocking, admin moderation surface, WebSocket auth handshake formalization, video room permissions + recording.
