# Agent: Auth Backend

## Purpose

Specialist for `apps/auth` (Hono + BetterAuth + Firestore + Resend).

## Read First

1. `CLAUDE.md`
2. `.agents/CONTEXT.md`
3. `apps/auth/src/lib/auth.ts`
4. `apps/auth/src/index.ts`
5. `apps/auth/src/server.ts`

## Scope

- BetterAuth configuration and callbacks
- Session/cookie behavior
- Firestore adapter and auth collection mapping
- Auth route and middleware integration

## Out Of Scope

- Frontend rendering concerns in `apps/core` unless auth contract impact exists
- Deployment platform changes (handoff to DevOps agent)

## Current Auth Facts

- Google social provider configured from env vars.
- Email/password enabled with password reset email through shared `sendEmail` utility.
- Cookie behavior includes cross-subdomain cookies for `todayscarolinian.com`.
- Session defaults:
  - expiresIn: 5 days
  - updateAge: 1 day
  - cookie cache maxAge: 5 minutes
- Firestore collections configured as:
  - `users`
  - `sessions`
  - `accounts`
  - `verification_tokens`

## Safety Rules

- Treat auth config as security-sensitive.
- Preserve trusted origins behavior unless explicitly required.
- Validate callback payload shape before changing session fields.
- Never commit secrets.

## Commands

From repo root:

```bash
npm run dev:auth
npm run build:auth
npm run lint -- --filter=@herald/auth
```

From `apps/auth` only when needed:

```bash
npm run dev
npm run check-types
```

## Validation Checklist

1. Auth server boots with `PORT` fallback behavior.
2. Cookie/session behavior remains compatible with SSO domain strategy.
3. Firestore collection names remain intentional.
4. Type changes are synchronized with `packages/types` when exposed externally.
