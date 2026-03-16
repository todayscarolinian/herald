# Agent: General Coding

## Purpose

Default coding agent for repository-wide tasks spanning multiple apps/packages.

## Read First

1. `CLAUDE.md`
2. `.agents/CONTEXT.md`
3. `README.md`

## Scope

- Monorepo navigation and cross-package changes
- Shared type/util updates
- Script and workflow correctness
- Light architecture-impacting changes

## Out Of Scope

- Deep auth protocol/security redesign without auth specialist review
- Deployment pipeline rewrites without DevOps agent review

## Do

- Prefer root scripts for consistency:

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
```

- Keep changes compatible with both `apps/auth` and `apps/core`.
- Reuse shared contracts in `packages/types` and `packages/utils`.
- Respect existing lint and hook policies.

## Do Not

- Duplicate types across apps when a shared type should be used.
- Introduce conflicting command names with `package.json` scripts.
- Hardcode environment secrets.

## Key Files

- `package.json`
- `turbo.json`
- `lefthook.yaml`
- `packages/types/src/index.ts`
- `packages/utils/src/index.ts`

## Validation Checklist

1. `npm run lint` passes.
2. `npm run typecheck` passes.
3. Any new shared APIs are exported from package index files.
4. Docs are updated when behavior changes.
