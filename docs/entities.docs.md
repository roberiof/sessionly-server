# Sessionly — Application Entities

---

## Overview

This document defines the main entities in Sessionly, including structures, relationships, and implicit business rules.

The model follows these principles:

- Data normalization
- Separation of responsibilities
- Future scalability
- MVP simplicity

---

## User

Base system entity. Represents any authenticated user.

```ts
User {
  id: string (uuid, pk)
  name: string
  bio?: string
  email: string (unique, indexed)
  passwordHash: string
  avatarUrl?: string
  role: 'MENTOR' | 'CLIENT' | 'ADMIN'
  activityStatus: 'ACTIVE' | 'INACTIVE' | 'NOT_DISTURB'
  links: string[]
  createdAt: Date
  updatedAt: Date
}
```

---

## MentorProfile

`User` extension for mentor-specific features.

```ts
MentorProfile {
  userId: string (pk, fk -> User.id)
  niche: string
  specialties: string[]
  chatPrice: number
  createdAt: Date
  updatedAt: Date
}
```

## ClientProfile

`User` extension for client-specific features.

```ts
ClientProfile {
  userId: string (pk, fk -> User.id)s
  interests: string[]
  createdAt: Date
  updatedAt: Date
}
```

---

## Session

Represents a scheduled mentorship session.

```ts
Session {
  id: string (pk)

  mentorId: string (fk -> User.id)
  clientId: string (fk -> User.id)

  startTime: Date
  endTime: Date

  price: number

  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'

  jitsiRoomId: string

  createdAt: Date
}
```

Rules:

- Price is a snapshot captured at creation time
- Session is created only after confirmed payment

---

## Chat

Permanent communication channel between mentor and client.

```ts
Chat {
  id: string (pk)

  mentorId: string (fk -> User.id)
  clientId: string (fk -> User.id)

  createdAt: Date

  UNIQUE (mentorId, clientId)
}
```

Rules:

- Only one chat per mentor/client pair
- Chat remains available after purchase

---

## Message

Messages exchanged inside a chat.

```ts
Message {
  id: string (pk)

  chatId: string (fk -> Chat.id)
  senderId: string (fk -> User.id)

  content: string

  createdAt: Date
  readAt?: Date
}
```

---

## Payment

Represents financial transactions in the platform.

```ts
Payment {
  id: string (pk)

  userId: string

  type: 'SESSION' | 'CHAT'

  referenceId: string

  amount: number
  currency: string

  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'

  stripePaymentIntentId: string

  createdAt: Date
}
```

Rules:

- `referenceId` points to a `Session` or `Chat`
- A payment unlocks access to its resource

---

## Review

Evaluation of a mentorship session.

```ts
Review {
  id: string (pk)

  sessionId: string (fk -> Session.id, unique)

  mentorId: string
  clientId: string

  rating: number
  comment: string

  createdAt: Date
}
```

Rules:

- A session can have only one review
- Review can only be submitted after session completion

---

## Relationships

- User 1:1 MentorProfile
- User 1:N Session (as mentor)
- User 1:N Session (as client)
- User 1:N Message
- Chat 1:N Message
- Session 1:1 Payment
- Chat 1:1 Payment (per client)
- Session 1:1 Review

---

## Derived Business Rules

### Chat Access

A user can access a chat only if there is:

- `Payment` with:
  - `type = 'CHAT'`
  - `referenceId = chatId`
  - `status = 'PAID'`

---

### Session Access

A user can access a session only if:

- User is the mentor or client of the session
- Session status allows access (e.g., `SCHEDULED` or `IN_PROGRESS`)
- Payment is confirmed

---
