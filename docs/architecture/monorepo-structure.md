# Monorepo Structure

## Core Principle

Organize by deployable application, share by capability.

## Applications

- `apps/api`: backend API service boundary
- `apps/admin`: Vue 3 admin application
- `apps/web`: Vue web application
- `apps/miniapp`: uni-app application

## Shared Packages

- `packages/shared/types`: DTO and domain types
- `packages/shared/constants`: stable shared constants
- `packages/shared/utils`: runtime-agnostic helpers
- `packages/shared/schemas`: validation and parsing contracts
- `packages/sdk/api-client`: request client and transport contracts
- `packages/sdk/openapi`: generated contract boundary
- `packages/ui/tokens`: design tokens
- `packages/server/database`: database access boundary
- `packages/configs/*`: shared workspace configs

## Dependency Direction

```text
apps -> sdk/ui/server/shared/configs
sdk/ui/server -> shared/configs
shared -> configs
```

## Naming

- App folders describe product role, not framework.
- Package names use the `@gaoge/*` scope.
- App-local imports use `@/`.
- Cross-package imports use workspace package names.
