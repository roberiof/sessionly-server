# Sessionly — Tech Stack

---

## Overview

This document describes the current and planned technology choices for the Sessionly client application.

Primary goals for the stack:

- Fast product iteration for MVP
- Strong developer experience and maintainability
- Scalable architecture for future growth
- Type safety and predictable UI behavior

---

## Frontend

- **Framework:** Next.js 16 (App Router)
- **UI Layer:** React 19
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4
- **UI Components:** Base UI primitives + custom components
- **Forms and Validation:** React Hook Form + Zod

---

## Design System and UI Development

- **Component Workbench:** Storybook 10
- **Story Coverage:** UI primitives and composed components
- **Visual/UX Documentation:** stories under `src/components/stories`

---

## Quality and Tooling

- **Linting:** ESLint 9 (Next.js + TypeScript + Storybook configs)
- **Formatting:** Prettier 3
- **Prettier in ESLint:** `prettier/prettier` rule enabled
- **Editor Integration:** format-on-save configured in workspace settings

---

## Testing

- **Unit/Component Testing:** Vitest
- **Browser/E2E Support:** Playwright integration
- **Storybook Testing Addon:** `@storybook/addon-vitest`

---

## Package and Dependency Management

- **Package Manager:** pnpm
- **Install Guard:** `only-allow pnpm` in `preinstall`
- **Lockfile Policy:** only `pnpm-lock.yaml`
- **CI Guard:** pipeline fails if `package-lock.json` or `yarn.lock` exists

---

## Project Structure (Current)

- `src/app` — app shell and routes
- `src/components/ui` — reusable UI primitives
- `src/components/stories` — Storybook stories
- `src/lib` and `src/utils` — shared helpers/utilities
- `src/types` — shared types
- `docs` — business and technical documentation

---

## Recommended Runtime Baseline

- Node.js 20+
- pnpm 10+

---

## Future Technical Evolutions

- Introduce API client layer standardization (typed contracts)
- Add stronger automated test coverage on critical flows
- Establish design tokens and theming governance
- Expand CI quality gates (coverage thresholds, affected checks)
- Add observability hooks for frontend errors and UX metrics

---
