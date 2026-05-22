# Admin 权限中心统一授权树改版 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把角色中心重构为“菜单访问 + 菜单内动作”同树授权工作台，移除前端全局动作模块，并把关联用户降为底部摘要区。

**Architecture:** 后端继续复用现有 `Role / Permission / Menu / RolePermission / MenuPermission` 模型，但统一保存接口要改成“菜单与菜单内动作一次保存，同时保留未暴露的全局权限不被误清空”。前端保留“左侧角色列表 + 右侧工作区”的总体结构，重做授权区为一棵内联动作树：目录节点只做层级组织，菜单节点负责访问勾选，已勾选菜单在节点下直接展开动作复选项，关联用户压缩为工作区底部摘要。

**Tech Stack:** NestJS, Prisma, Jest, Vue 3, Element Plus, TypeScript, pnpm monorepo

---

### Task 1: 收敛共享契约到“统一授权树 + 隐藏全局权限保留”语义

**Files:**

- Modify: `packages/shared/types/src/system-role.ts`
- Modify: `apps/admin/src/api/system/role/index.ts`
- Modify: `apps/api/src/modules/system/role/dto/update-system-role-workspace.dto.ts`

- [ ] **Step 1: 先让共享 payload 反映新保存语义**

```ts
export interface UpdateSystemRoleWorkspacePayload {
  menuIds: number[]
  menuPermissionIdsByMenu: Record<number, number[]>
  globalPermissionIds?: number[]
}
```

- [ ] **Step 2: 后端 DTO 对 `globalPermissionIds` 改为可选，缺失时按“保留现状”处理**

```ts
@IsArray()
@IsOptional()
@Type(() => Number)
@IsInt({ each: true })
globalPermissionIds?: number[]
```

- [ ] **Step 3: 前端角色中心只保留统一保存接口调用**

Run: `rg -n "updateMenuAccess|updatePermissions|globalPermissionIds" apps/admin/src/views/system/role apps/admin/src/api/system/role`
Expected: 角色中心页面不再依赖旧双保存接口；`globalPermissionIds` 仅保留在共享 API 类型里，不再作为前端页面显式工作区状态。

### Task 2: 用 TDD 修正角色工作区保存链，避免隐藏权限被误清空

**Files:**

- Modify: `apps/api/src/modules/system/role/system-role.service.ts`
- Modify: `apps/api/src/modules/system/role/system-role.service.spec.ts`

- [ ] **Step 1: 先写失败测试，覆盖“前端不传全局权限时保留原值”**

```ts
it('preserves existing global permissions when workspace save omits globalPermissionIds', async () => {
  await service.updateWorkspace(2, {
    menuIds: [2],
    menuPermissionIdsByMenu: { 2: [14] },
  })

  expect(prisma.rolePermission.createMany).toHaveBeenCalledWith({
    data: expect.arrayContaining([
      { roleId: 2, permissionId: 11 },
      { roleId: 2, permissionId: 12 },
      { roleId: 2, permissionId: 14 },
    ]),
    skipDuplicates: true,
  })
})
```

- [ ] **Step 2: 再写失败测试，覆盖“取消菜单即清空该菜单动作，但不影响隐藏全局权限”**

```ts
it('drops menu actions for unchecked menus without clearing hidden global permissions', async () => {
  await service.updateWorkspace(2, {
    menuIds: [],
    menuPermissionIdsByMenu: { 2: [14] },
  })

  expect(prisma.rolePermission.createMany).toHaveBeenCalledWith({
    data: [{ roleId: 2, permissionId: 12 }],
    skipDuplicates: true,
  })
})
```

- [ ] **Step 3: 运行角色服务测试，确认新语义先失败**

Run: `pnpm --filter @gaoge/app-api test -- system-role.service`
Expected: FAIL，断言显示 `globalPermissionIds` 缺失时现有实现会把全局权限清空。

- [ ] **Step 4: 最小实现“可选全局权限 + 保留现存隐藏权限”**

```ts
const selectedPermissionIds = getSelectedPermissionIdSet(permissions, id)
const currentGlobalPermissionIds = permissions
  .filter((item) => item.menuPermissions.length === 0 && selectedPermissionIds.has(item.id))
  .map((item) => item.id)

const finalPermissionIds = buildWorkspacePermissionIds({
  menus,
  permissions,
  selectedMenuIds,
  menuPermissionIdsByMenu: payload.menuPermissionIdsByMenu,
  globalPermissionIds: payload.globalPermissionIds ?? currentGlobalPermissionIds,
})
```

- [ ] **Step 5: 重跑角色服务测试**

Run: `pnpm --filter @gaoge/app-api test -- system-role.service`
Expected: PASS

### Task 3: 把角色中心授权区重构成单树工作台

**Files:**

- Modify: `apps/admin/src/views/system/role/index.vue`
- Modify: `apps/admin/src/views/system/role/constants.ts`
- Modify: `apps/admin/src/views/system/role/components/RoleMenuPanel.vue`
- Delete: `apps/admin/src/views/system/role/components/RoleGlobalPermissionPanel.vue`
- Modify: `apps/admin/src/views/system/role/components/RoleRelatedUserPanel.vue`

- [ ] **Step 1: 先让前端类型检查失败，逼出旧面板依赖**

Run: `pnpm --filter @gaoge/app-admin typecheck`
Expected: FAIL，页面仍依赖 `RoleGlobalPermissionPanel`、`activeMenuId` 或旧授权状态结构。

- [ ] **Step 2: 页面层删掉“当前菜单 + 全局动作”状态，只保留统一树所需数据**

```ts
const selectedMenuIds = ref<number[]>([])
const selectedMenuPermissionIdsByMenu = ref<Record<number, number[]>>({})

function hydrateWorkspace(detail: SystemRoleWorkspaceDetail) {
  workspaceDetail.value = detail
  selectedMenuIds.value = collectCheckedMenuIds(detail.menuTree)
  selectedMenuPermissionIdsByMenu.value = collectCheckedPermissionIdsByMenu(
    detail.menuPermissionGroups,
  )
}
```

- [ ] **Step 3: 把 `RoleMenuPanel` 改成“可勾菜单 + 菜单下内联动作”的统一树**

```vue
<RoleMenuPanel
  :menu-tree="workspaceDetail.menuTree"
  :menu-permission-groups="workspaceDetail.menuPermissionGroups"
  :selected-menu-ids="selectedMenuIds"
  :selected-menu-permission-ids-by-menu="selectedMenuPermissionIdsByMenu"
  @update:menu-ids="handleMenuIdsChange"
  @update:menu-permission-ids-by-menu="selectedMenuPermissionIdsByMenu = $event"
/>
```

- [ ] **Step 4: 目录节点只做结构，菜单节点才显示动作区**

```ts
function isActionExpandable(node: SystemRoleMenuNode) {
  return node.menuType === 'menu' && selectedMenuIds.value.includes(node.id)
}
```

- [ ] **Step 5: 菜单取消勾选时同步清空该菜单动作**

```ts
function handleMenuIdsChange(nextMenuIds: number[]) {
  const nextMenuIdSet = new Set(nextMenuIds)

  selectedMenuPermissionIdsByMenu.value = Object.fromEntries(
    Object.entries(selectedMenuPermissionIdsByMenu.value).map(([menuId, permissionIds]) => [
      Number(menuId),
      nextMenuIdSet.has(Number(menuId)) ? permissionIds : [],
    ]),
  ) as Record<number, number[]>

  selectedMenuIds.value = nextMenuIds
}
```

- [ ] **Step 6: 删除 `RoleGlobalPermissionPanel` 接入，保存时只提交菜单与菜单内动作**

```ts
await systemRoleApi.saveWorkspace(selectedRoleId.value, {
  menuIds: selectedMenuIds.value,
  menuPermissionIdsByMenu: selectedMenuPermissionIdsByMenu.value,
})
```

- [ ] **Step 7: 把关联用户改成底部摘要卡，不再渲染整张表**

```vue
<RoleRelatedUserPanel
  :users="workspaceDetail.relatedUsers"
  :user-count="selectedRole.userCount"
  @manage-users="jumpToUserPage"
/>
```

- [ ] **Step 8: 重跑后台类型检查**

Run: `pnpm --filter @gaoge/app-admin typecheck`
Expected: PASS

### Task 4: 清理样式和交互文案，验证改版结果

**Files:**

- Modify: `apps/admin/src/views/system/role/index.vue`
- Modify: `apps/admin/src/views/system/role/components/RoleMenuPanel.vue`
- Modify: `apps/admin/src/views/system/role/components/RoleRelatedUserPanel.vue`
- Modify: `apps/api/src/modules/system/role/system-role.service.ts`
- Modify: `apps/api/src/modules/system/role/system-role.service.spec.ts`
- Modify: `packages/shared/types/src/system-role.ts`

- [ ] **Step 1: 运行角色服务测试**

Run: `pnpm --filter @gaoge/app-api test -- system-role.service`
Expected: PASS

- [ ] **Step 2: 运行后台类型检查**

Run: `pnpm --filter @gaoge/app-admin typecheck`
Expected: PASS

- [ ] **Step 3: 运行角色中心相关样式检查**

Run: `pnpm exec stylelint apps/admin/src/views/system/role/index.vue apps/admin/src/views/system/role/components/RoleMenuPanel.vue apps/admin/src/views/system/role/components/RoleRelatedUserPanel.vue`
Expected: PASS

- [ ] **Step 4: 运行格式检查**

Run: `pnpm exec prettier --check apps/admin/src/views/system/role/index.vue apps/admin/src/views/system/role/components/RoleMenuPanel.vue apps/admin/src/views/system/role/components/RoleRelatedUserPanel.vue apps/api/src/modules/system/role/system-role.service.ts apps/api/src/modules/system/role/system-role.service.spec.ts packages/shared/types/src/system-role.ts apps/api/src/modules/system/role/dto/update-system-role-workspace.dto.ts`
Expected: PASS
