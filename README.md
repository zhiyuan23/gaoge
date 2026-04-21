# Gaoge Monorepo

This branch rebuilds the repository as a full-stack monorepo baseline.

## Layout

- `apps/`: deployable products and services
- `packages/`: shared capabilities and tooling
- `infra/`: deployment and environment assets
- `docs/`: architecture and conventions

## First-Phase Scope

- `apps/api`: NestJS-aligned backend entrypoint
- `apps/admin`: Vue 3 admin shell
- `apps/web`: Vue web shell
- `apps/miniapp`: uni-app shell
- `packages/shared/*`: types, constants, utils, schemas
- `packages/sdk/*`: API client and contract generation boundary
- `packages/ui/tokens`: cross-platform design tokens
- `packages/server/database`: backend database boundary
- `packages/configs/*`: workspace config packages

## Rules

1. `apps/*` may depend on `packages/*`.
2. `packages/*` must never depend on `apps/*`.
3. `shared/*` stays runtime-agnostic.
4. UI is shared per framework, not across all frameworks by force.
