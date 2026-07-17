# Personal Settings Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the completed admin personal settings capability from `gaoge-compass` into `gaoge`, adapted to `gaoge`'s current auth model.

**Architecture:** Add backend self-service profile and password endpoints under `AuthController`, expose typed admin API clients, and replace the old placeholder personal settings panel with a two-section profile/password UI. Do not introduce tenant context or `sessionVersion`; `gaoge` currently uses direct user roles and refresh-token cleanup.

**Tech Stack:** NestJS, Prisma, Vue 3, Pinia, Element Plus, `@gaoge/shared-types`.

## Global Constraints

- Keep changes scoped to personal settings.
- Do not migrate `gaoge-compass` tenant-only fields into `gaoge`.
- Do not introduce a Prisma `sessionVersion` migration for this sync.
- Preserve existing `gaoge` monorepo conventions from `AGENTS.md`.

---

### Task 1: Backend Contracts and Tests

**Files:**

- Modify: `packages/shared/types/src/auth.ts`
- Create: `apps/api/src/modules/auth/dto/update-profile.dto.ts`
- Create: `apps/api/src/modules/auth/dto/change-password.dto.ts`
- Modify: `apps/api/src/modules/auth/auth.service.spec.ts`

**Interfaces:**

- Produces: `UpdateAuthProfilePayload`, `ChangePasswordPayload`, `ChangePasswordResponse`
- Produces: `UpdateProfileDto`, `ChangePasswordDto`
- Produces failing tests for `AuthService.updateProfile()` and `AuthService.changePassword()`

- [ ] Add shared payload and response types.
- [ ] Add DTOs with validation decorators.
- [ ] Add service tests proving profile update serializes the latest user and password change rejects wrong current password, rejects same new password, updates hash, and deletes refresh tokens.
- [ ] Run `pnpm --filter @gaoge/app-api test -- auth.service.spec.ts`; expected initial failure before implementation.

### Task 2: Backend Implementation and Routes

**Files:**

- Modify: `apps/api/src/modules/auth/auth.controller.ts`
- Modify: `apps/api/src/modules/auth/auth.service.ts`
- Modify: `apps/admin/src/api/user/index.ts`

**Interfaces:**

- Consumes: DTOs and shared types from Task 1
- Produces: `PATCH /auth/profile`
- Produces: `PATCH /auth/password`
- Produces: admin API methods `updateProfile()` and `changePassword()`

- [ ] Add controller routes guarded by `JwtAuthGuard`.
- [ ] Add `AuthService.updateProfile(userId, dto)` using trimmed nickname and nullable avatar URL.
- [ ] Add `AuthService.changePassword(userId, dto)` using existing password utilities, refresh-token cleanup, and clear errors.
- [ ] Update admin API client to call the new routes.
- [ ] Run `pnpm --filter @gaoge/app-api test -- auth.service.spec.ts`; expected pass.

### Task 3: Admin Store and Personal Settings UI

**Files:**

- Modify: `apps/admin/src/store/user/index.ts`
- Replace: `apps/admin/src/slots/ToolbarEnd/profile.vue`
- Create: `apps/admin/src/slots/ToolbarEnd/profile/model.ts`
- Create: `apps/admin/src/slots/ToolbarEnd/profile/BasicSettingsForm.vue`
- Modify: `apps/admin/src/components/business/AccountForm/EditPasswordForm.vue`
- Modify: `apps/admin/src/slots/ToolbarEnd/index.vue`

**Interfaces:**

- Consumes: admin API methods from Task 2
- Produces: `userStore.profile`, `userStore.roles`, `userStore.updateProfile()`, `userStore.changePassword()`
- Produces: basic profile settings form with success message and close-on-success
- Produces: password form that logs out after successful password change

- [ ] Update user store to maintain profile, roles, nickname/displayName, update profile, and change password.
- [ ] Replace placeholder profile panel with two-section settings layout.
- [ ] Add profile draft mapper helpers.
- [ ] Add basic settings form.
- [ ] Adapt password form to emit dirty/close/password-changed events and call `changePassword`.
- [ ] Ensure `ToolbarEnd/index.vue` closes the modal through `Profile @close`.
- [ ] Run `pnpm --filter @gaoge/app-admin typecheck`; expected pass.

### Task 4: Final Verification

**Files:**

- No source changes unless verification exposes an issue.

**Interfaces:**

- Verifies backend and frontend compile/test state.

- [ ] Run `pnpm --filter @gaoge/app-api test`.
- [ ] Run `pnpm --filter @gaoge/app-api typecheck`.
- [ ] Run `pnpm --filter @gaoge/app-admin typecheck`.
- [ ] Report changed files and any verification caveats.
