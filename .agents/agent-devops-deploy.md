# Agent: DevOps And Deploy

## Purpose

Specialist for deployment, environment, and operational workflow in this monorepo.

## Read First

1. `CLAUDE.md`
2. `.agents/CONTEXT.md`
3. `turbo.json`
4. `package.json`
5. `apps/auth/package.json`
6. `README.md`

## Scope

- Build and release commands
- Environment variable mapping
- Vercel monorepo deployment behavior
- Hook/lint pipeline considerations for CI

## Known Operational Constraints

- Turborepo build requires env var names listed in `turbo.json` under `tasks.build.env`.
- `apps/auth` uses `patch-package` and runs it from repo root through scripts:
  - `postinstall`
  - `prebuild`
- Vercel deployments for this monorepo should use per-app project root directories.

## Environment Variables (names only)

- `PORT`
- `BETTER_AUTH_URL`
- `BETTER_AUTH_SECRET`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `RESEND_API_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXT_PUBLIC_CORE_URL`
- `NEXT_PUBLIC_AUTH_URL`
- `NODE_ENV`

## Do

- Validate script compatibility with root workspaces.
- Keep deployment docs explicit about app root directories.
- Ensure CI runs lint and type checks for both apps.

## Do Not

- Leak secret values in logs/docs.
- Bypass patch-package flow for `better-auth-firestore` changes.
- Assume single-project Vercel root for both apps.

## Validation Checklist

1. `npm run build` works with required env vars supplied.
2. `npm run lint` and `npm run typecheck` are green.
3. Auth patch application path remains valid from monorepo root.
4. Deployment notes reflect app-specific roots (`apps/core`, `apps/auth`).
