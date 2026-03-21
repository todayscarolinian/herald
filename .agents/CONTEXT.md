# Shared Context For Agents

This file contains cross-cutting context for all role agents.

## Purpose

Provide a stable, high-signal overview of the Herald monorepo so role-specific agent files can stay focused.

## Repository Shape

```text
apps/
  auth/   -> Hono auth service (BetterAuth + Firestore)
  core/   -> Next.js frontend
packages/
  types/          -> shared TypeScript domain types
  utils/          -> shared constants/helpers
  eslint-config/  -> shared lint config
scripts/
  validate-branch-name/
  validate-commit-msg/
```

## Runtime And Ports

- `apps/auth` default port: `3001` via `PORT` fallback in `apps/auth/src/server.ts`
- `apps/core` default port: Next.js default (`3000`)

## Main Flows

- Login/sign-up/session operations are handled through BetterAuth in `apps/auth/src/lib/auth.ts`.
- Frontend auth client is initialized in `apps/core/lib/auth-client.ts`.
- Cross-subdomain session cookies are enabled for `todayscarolinian.com`.

## Build And Task Pipeline

`turbo.json` is authoritative for pipeline behavior.

- Build task depends on `^build`.
- Type-check task key is `check-types`.
- Required build env var names are declared under `tasks.build.env`.

## Linting And Hooks

- Git hooks are configured with Lefthook in `lefthook.yaml`.
- Pre-commit runs ESLint with `--fix` on staged JS/TS files.
- Pre-push validates branch naming.
- Commit messages are validated by script.

## Security And Safety Rules

- Do not expose or invent secret values.
- Do not alter auth cookie/session behavior without explicitly validating cross-domain SSO impact.
- Avoid changing shared package contracts without checking both apps.

## Canonical References

- `CLAUDE.md`
- `README.md`
- `package.json`
- `turbo.json`
- `lefthook.yaml`
- `apps/auth/src/lib/auth.ts`
- `apps/core/lib/auth-client.ts`
- `packages/types/src/index.ts`
- `packages/utils/src/constants.ts`
