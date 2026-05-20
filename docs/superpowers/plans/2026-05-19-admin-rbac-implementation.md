# Admin RBAC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first real admin RBAC implementation for `apps/api` and `apps/admin` while keeping the current static route/menu runtime intact.

**Architecture:** Add database-backed RBAC entities and sync logic in `apps/api`, switch admin login and `auth/permission` to role-permission aggregation, then layer real CRUD-style system management pages on top of the new APIs in `apps/admin`. Keep existing `meta.auth` and static routes as the runtime contract, and treat menu records as managed metadata only.

**Tech Stack:** NestJS, Prisma, PostgreSQL, Jest, Vue 3, Element Plus, Pinia, TypeScript

---

### Task 1: Define the RBAC backend contract

**Files:**

- Modify: `apps/api/prisma/schema.prisma`
- Modify: `apps/api/prisma/seed.ts`
- Modify: `packages/shared/types/src/auth.ts`
- Modify: `packages/shared/types/src/system-user.ts`
- Create: `packages/shared/types/src/system-role.ts`
- Create: `packages/shared/types/src/system-permission.ts`
- Create: `packages/shared/types/src/system-menu.ts`
- Modify: `packages/shared/types/src/index.ts`

- [ ] Add Prisma models for `Role`, `Permission`, `Menu`, `UserRole`, `RolePermission`, and `MenuPermission`, plus the relation fields on `User`.
- [ ] Keep `User.role` for compatibility, but ensure new role linkage is modeled as the source of truth for future authorization.
- [ ] Extend shared auth response types so `auth/permission` can return aggregated `roles` and `permissions`.
- [ ] Replace single-role system-user contracts with `roleIds` input and `roles[]` output.
- [ ] Add shared type exports for role, permission, and menu pages so admin and api can consume the same contract.

### Task 2: Add built-in RBAC definitions and sync support

**Files:**

- Create: `apps/api/src/modules/system/rbac/builtins.ts`
- Create: `apps/api/src/modules/system/rbac/rbac-sync.service.ts`
- Create: `apps/api/src/modules/system/rbac/rbac-sync.service.spec.ts`
- Modify: `apps/api/prisma/seed.ts`

- [ ] Write a failing test for built-in sync behavior covering idempotent upsert, metadata refresh, and no destructive deletes.
- [ ] Implement built-in definitions for roles, permissions, and system menus based on the spec and current static routes.
- [ ] Implement a sync service that upserts built-in roles, permissions, menus, and relationship tables.
- [ ] Update the seed path so admin bootstrap can create the default admin user and bind the built-in super admin role.

### Task 3: Switch auth from hardcoded role permissions to database aggregation

**Files:**

- Modify: `apps/api/src/modules/auth/services/auth.service.ts`
- Modify: `apps/api/src/modules/auth/permissions.ts`
- Add or modify tests under: `apps/api/src/modules/auth/services/auth.service.spec.ts`

- [ ] Write failing auth tests for admin login eligibility, no-role rejection, multi-role permission union, and disabled role/permission filtering.
- [ ] Update login eligibility to require a backend account, active user status, and at least one active linked role.
- [ ] Replace the hardcoded `buildPermissions(user.role)` path with database reads across `UserRole -> RolePermission -> Permission`.
- [ ] Return aggregated `roles` and `permissions` from `getPermission`, while preserving the current permission array shape used by admin.
- [ ] Keep miniapp behavior unchanged.

### Task 4: Replace system-user single-role flows with multi-role flows

**Files:**

- Modify: `apps/api/src/modules/system/user/dto/create-system-user.dto.ts`
- Modify: `apps/api/src/modules/system/user/dto/update-system-user.dto.ts`
- Modify: `apps/api/src/modules/system/user/dto/system-user-list.dto.ts`
- Modify: `apps/api/src/modules/system/user/system-user.service.ts`
- Modify: `apps/api/src/modules/system/user/system-user.service.spec.ts`
- Modify: `apps/api/src/modules/system/user/system-user.controller.ts`

- [ ] Write failing service/controller tests for create/update/search with `roleIds`, returned `roles[]`, and built-in admin safety rules.
- [ ] Update create/update payload validation from `role` to `roleIds`.
- [ ] Load roles in list/detail queries and return them in the shared response shape.
- [ ] Persist user-role assignments transactionally and block invalid built-in admin downgrades or deletions.
- [ ] Add the dedicated `PATCH /system/users/:id/roles` path only if needed by the UI; otherwise keep assignment in create/update to avoid duplicate flows.

### Task 5: Add role, permission, and menu backend modules

**Files:**

- Create under `apps/api/src/modules/system/role/*`
- Create under `apps/api/src/modules/system/permission/*`
- Create under `apps/api/src/modules/system/menu/*`
- Modify: `apps/api/src/modules/system/system.module.ts`
- Modify: `apps/api/src/common/auth/*` if new permission guard/decorator is introduced

- [ ] Write failing service tests for role CRUD, permission assignment, permission metadata updates, built-in sync trigger, menu tree CRUD, and delete guards.
- [ ] Implement `system/roles` endpoints with list/create/update/status/delete and permission assignment.
- [ ] Implement `system/permissions` endpoints with list/grouped/update/sync-builtins`while keeping`code` immutable.
- [ ] Implement `system/menus/tree` endpoints with CRUD, sort updates, and permission binding.
- [ ] Introduce permission-based guard/decorator for system-management modules and move those endpoints off `RolesGuard`.

### Task 6: Update admin shared auth state and user page

**Files:**

- Modify: `apps/admin/src/api/user/index.ts`
- Modify: `apps/admin/src/store/user/index.ts`
- Modify: `apps/admin/src/api/system/user/index.ts`
- Modify: `apps/admin/src/views/system/user/**/*`

- [ ] Update admin-side auth typing to accept the expanded permission response and keep `permissions` as the effective UI source.
- [ ] Refactor system-user page models, search schema, form schema, and table columns from single `role` to `roles[]`/`roleIds[]`.
- [ ] Replace the role select in the user form with a multi-select bound to backend roles.
- [ ] Show role tags in the list view and keep existing CRUD interactions intact.
- [ ] Preserve `destroy-on-close` dialog behavior and existing permission checks.

### Task 7: Build real role, permission, and menu admin pages

**Files:**

- Create or modify: `apps/admin/src/api/system/role/*`
- Create or modify: `apps/admin/src/api/system/permission/*`
- Create or modify: `apps/admin/src/api/system/menu/*`
- Modify: `apps/admin/src/views/system/role/index.vue`
- Modify: `apps/admin/src/views/system/menu/index.vue`
- Modify: `apps/admin/src/views/system/permission/index.vue`
- Add supporting view-local components/models/schemas as needed

- [ ] Implement role management as a real list page with form dialog, status toggle, delete, and permission-assignment dialog/drawer.
- [ ] Implement permission management as a dictionary page with filters, metadata editing, and “同步内置权限”.
- [ ] Implement menu management as a tree table/list with CRUD, visible/status fields, and permission binding.
- [ ] Use built-in route name/path values that match the current static routes and avoid any runtime dynamic-route registration.

### Task 8: Verify and stabilize the change

**Files:**

- Modify any touched files as needed after verification feedback

- [ ] Run targeted API tests for RBAC-related modules.
- [ ] Run `pnpm --filter @gaoge/app-api typecheck`.
- [ ] Run `pnpm --filter @gaoge/app-admin typecheck`.
- [ ] Run targeted lint or formatting commands if verification reports issues.
- [ ] Re-check the spec to confirm static routes remain the runtime source and all four system pages have real responsibilities.
