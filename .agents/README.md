# .agents Documentation Index

This folder contains role-specific context for Claude-compatible agents.

## Read Order

1. `../CLAUDE.md`
2. `.agents/CONTEXT.md`
3. One or more role docs below based on task type

## Role Docs

- `agent-general.md` - Default cross-repo coding agent
- `agent-auth-backend.md` - Auth API specialist (`apps/auth`)
- `agent-core-frontend.md` - Frontend specialist (`apps/core`)
- `agent-devops-deploy.md` - Build/deploy/ops specialist

## How To Use

- Single-domain task: read only the matching role doc + shared context.
- Cross-domain task: read `agent-general.md` first, then role docs as needed.
- Security-sensitive auth changes: always include `agent-auth-backend.md`.

## Maintenance Rules

- Keep facts aligned to source files and scripts.
- Avoid copying large source blocks; summarize behavior and point to canonical files.
- Update this index when role files are added/renamed.
