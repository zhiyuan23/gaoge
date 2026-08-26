# Admin RBAC Dynamic Config Implementation Plan

> **历史实施计划。** 当前执行和排障入口已合并为 [2026-08-26 Admin RBAC 工程底座实施与验证记录](./2026-08-26-admin-rbac-foundation-implementation.md)，请勿再按本文阶段任务重复迁移。

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the current admin RBAC implementation so menu management and permission management are database-configurable while keeping front-end route components controlled by code.

**Architecture:** Extend the existing NestJS/Prisma RBAC modules with permission CRUD and stronger menu tree validation, then update Vue admin pages and shared types to expose the dynamic operations. Authorization remains role-permission based; menu configuration remains metadata and access binding, not arbitrary component execution.

**Tech Stack:** NestJS, Prisma, Jest, Vue 3, Element Plus, TypeScript, pnpm

---

### Task 1: Permission CRUD Backend

**Files:**

- Modify: `packages/shared/types/src/system-permission.ts`
- Create: `apps/api/src/modules/system/permission/dto/create-system-permission.dto.ts`
- Modify: `apps/api/src/modules/system/permission/system-permission.service.ts`
- Modify: `apps/api/src/modules/system/permission/system-permission.controller.ts`
- Test: `apps/api/src/modules/system/permission/system-permission.service.spec.ts`

- [ ] Write service tests for creating a custom permission, rejecting duplicate/invalid codes, deleting non-built-in permissions, blocking built-in deletes, and blocking referenced deletes.
- [ ] Add shared `CreateSystemPermissionPayload`.
- [ ] Add `CreateSystemPermissionDto` with `code`, `name`, `description`, and `status`.
- [ ] Implement `create()` by parsing `module.resource.action` from `code` and setting `isBuiltIn: false`.
- [ ] Implement `remove()` with built-in, role binding, and menu binding guards.
- [ ] Add `POST /system/permissions` and `DELETE /system/permissions/:id` guarded by permission codes.

### Task 2: Menu Tree Safety Backend

**Files:**

- Modify: `packages/shared/types/src/system-menu.ts`
- Modify: `apps/api/src/modules/system/menu/dto/update-system-menu.dto.ts`
- Modify: `apps/api/src/modules/system/menu/system-menu.service.ts`
- Test: `apps/api/src/modules/system/menu/system-menu.service.spec.ts`

- [ ] Write service tests for parent update, self-parent rejection, descendant-parent rejection, sibling uniqueness, and built-in delete protection.
- [ ] Add `parentId` to `UpdateSystemMenuPayload`.
- [ ] Allow menu edit form to move a menu under another parent.
- [ ] Validate parent exists and is not the current menu or a descendant.
- [ ] Validate same-parent `name` and `path` uniqueness on create and update.

### Task 3: Admin Permission Page

**Files:**

- Modify: `apps/admin/src/api/system/permission/index.ts`
- Modify: `apps/admin/src/views/system/permission/auth.ts`
- Modify: `apps/admin/src/views/system/permission/model/types.ts`
- Modify: `apps/admin/src/views/system/permission/model/defaults.ts`
- Modify: `apps/admin/src/views/system/permission/model/mapper.ts`
- Modify: `apps/admin/src/views/system/permission/components/PermissionForm.vue`
- Modify: `apps/admin/src/views/system/permission/components/PermissionFormDialog.vue`
- Modify: `apps/admin/src/views/system/permission/schemas/table.ts`
- Modify: `apps/admin/src/views/system/permission/index.vue`

- [ ] Add API methods for create and delete.
- [ ] Add `system.permission.create` and `system.permission.delete` permission constants.
- [ ] Add create/edit form mode with `code` input only enabled on create.
- [ ] Add “新增权限” button.
- [ ] Add row actions for edit and delete; hide delete for built-in permissions in UI and enforce on backend.
- [ ] Refresh list after create, update, delete, and sync.

### Task 4: Admin Menu Page

**Files:**

- Modify: `apps/admin/src/api/system/menu/index.ts`
- Modify: `apps/admin/src/views/system/menu/model/types.ts`
- Modify: `apps/admin/src/views/system/menu/model/defaults.ts`
- Modify: `apps/admin/src/views/system/menu/model/mapper.ts`
- Modify: `apps/admin/src/views/system/menu/components/MenuForm.vue`
- Modify: `apps/admin/src/views/system/menu/index.vue`

- [ ] Send `parentId` on menu update.
- [ ] Exclude the currently edited menu and its descendants from parent selector.
- [ ] Show menu type and bound permission count clearly in the tree table.
- [ ] Keep delete operation available only when backend allows it.

### Task 5: Permission Assignment UX

**Files:**

- Modify: `apps/admin/src/views/system/role/components/PermissionDialog.vue`
- Modify: `apps/admin/src/views/system/menu/components/PermissionDialog.vue`
- Modify: `apps/admin/src/views/system/role/constants.ts`
- Modify: `apps/admin/src/views/system/menu/constants.ts`

- [ ] Group permissions by `module/resource`.
- [ ] Show selected count and permission code next to each checkbox.
- [ ] Keep the dialog simple: no separate role-menu assignment concept.

### Task 6: Verification

**Files:**

- Modify touched files only if verification reports issues.

- [ ] Run targeted permission service tests.
- [ ] Run targeted menu service tests.
- [ ] Run API typecheck.
- [ ] Run admin typecheck.
- [ ] Run lint if typecheck passes or reports style-sensitive issues.
