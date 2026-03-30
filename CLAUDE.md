# CLAUDE.md

This file is the primary entrypoint for Claude-compatible agents working in this repository.

## Project Summary

Herald is Today's Carolinian's centralized Identity Provider (IdP) for SSO across TC applications.

- Monorepo: Turborepo workspaces
- Frontend app: `apps/core` (Next.js 16 + React 19)
- Auth API app: `apps/auth` (Hono + BetterAuth + Firestore)
- Shared packages: `packages/types`, `packages/utils`, `packages/eslint-config`, `packages/typescript-config`

## Start Here

1. Read `.agents/README.md` for the map.
2. Read `.agents/CONTEXT.md` for system-level context.
3. Choose role docs from `.agents/` based on task scope:
   - `.agents/agent-general.md`
   - `.agents/agent-auth-backend.md`
   - `.agents/agent-core-frontend.md`
   - `.agents/agent-devops-deploy.md`

## Critical Constraints

- Never commit or print secret values from environment variables.
- Keep auth behavior aligned with `apps/auth/src/lib/auth.ts`.
- Keep shared types in sync with `packages/types/src/*`.
- Preserve linting/hooks conventions from `lefthook.yaml` and shared ESLint config.
- Deployment guidance must respect monorepo app roots on Vercel.

## Common Commands

Run from repository root:

```bash
npm run dev
npm run dev:auth
npm run dev:core
npm run build
npm run lint
npm run typecheck
```

## Canonical Source Files

- `README.md`
- `package.json`
- `turbo.json`
- `lefthook.yaml`
- `apps/auth/src/lib/auth.ts`
- `apps/auth/src/index.ts`
- `apps/auth/src/server.ts`
- `apps/core/lib/auth-client.ts`
- `packages/types/src/index.ts`
- `packages/utils/src/constants.ts`

## Quick Architecture Snapshot

- Browser -> `apps/core` (UI)
- UI and client apps -> `apps/auth` (auth/session APIs)
- Auth service -> Firestore (`users`, `sessions`, `accounts`, `verification_tokens`)
- Auth service -> Resend (password reset emails)
- Auth service -> Google OAuth provider

## Change Checklist For Agents

Before finishing a task, verify:

1. Commands are runnable from repo root unless explicitly app-scoped.
2. No contradiction with env var names in `turbo.json`.
3. Auth cookie/session changes preserve cross-subdomain behavior.
4. Role-specific guidance is documented under `.agents/` when adding new patterns.
