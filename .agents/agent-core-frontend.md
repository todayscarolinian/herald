# Agent: Core Frontend

## Purpose

Specialist for `apps/core` (Next.js App Router UI and auth client integration).

## Read First

1. `CLAUDE.md`
2. `.agents/CONTEXT.md`
3. `apps/core/lib/auth-client.ts`
4. `apps/core/app/layout.tsx`
5. `apps/core/app/page.tsx`

## Scope

- Next.js UI logic and component wiring
- Auth client usage and session-aware UI behavior
- Frontend type-safe integration with shared packages

## Out Of Scope

- Backend auth provider mechanics in `apps/auth/src/lib/auth.ts`
- Deployment infrastructure changes

## Frontend Integration Facts

- BetterAuth client is initialized in `apps/core/lib/auth-client.ts`.
- `NEXT_PUBLIC_AUTH_URL` controls auth client base URL when present.
- Shared packages should be preferred for domain types/utils.

## UI And Accessibility Rules

- Favor readable layouts, clear spacing, and accessible control sizes.
- Reuse existing component patterns under `apps/core/components`.
- Avoid introducing visual inconsistency with existing Tailwind/shadcn setup.

## Commands

From repo root:

```bash
npm run dev:core
npm run build:core
npm run lint -- --filter=@herald/core
```

From `apps/core` only when needed:

```bash
npm run dev
npm run check-types
```

## Validation Checklist

1. Client auth flow still resolves base URL correctly.
2. UI changes build successfully with Next.js 16.
3. Types remain imported from shared packages when applicable.
4. No hardcoded secret-like values in frontend code.
