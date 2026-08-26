# Admin Access Workspace Reference Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make menu/resource mode switching stay inside one Admin page and remove auto-generated built-in Resource hint text.

**Architecture:** Keep the existing `SystemAccessWorkspace` component and compatibility route, but remove URL query synchronization so the mode is component-local like the reference implementation. Keep the Resource description contract intact while changing built-in definitions to use an empty default description, allowing the existing conditional UI to hide generic hints.

**Tech Stack:** Vue 3, Vue Router 5, Element Plus, Node test runner, NestJS, Jest, Prisma 5

## Global Constraints

- Preserve unrelated dirty working-tree changes.
- Do not modify Resource, Permission, or Menu database models and API contracts.
- Do not change permission codes, role grants, navigation visibility semantics, or audit behavior.
- Preserve `/system/permission` as a compatibility route.
- Follow the confirmed design in `docs/superpowers/specs/2026-08-26-admin-access-workspace-reference-alignment-design.md`.

---

### Task 1: Keep menu/resource switching inside one page

**Files:**

- Create: `apps/admin/tests/system-access-workspace.test.ts`
- Create: `apps/admin/src/views/system/menu/workspace-mode.ts`
- Modify: `apps/admin/src/views/system/menu/workspace.vue`
- Modify: `apps/admin/src/router/modules/system/index.ts`

**Interfaces:**

- Consumes: Vue component-local refs and the existing `systemMenu` named route.
- Produces: `useSystemAccessWorkspaceMode()` with local `mode`, `search`, `mobileDetailOpen`, and `switchMode`; `/system/permission` redirects to `{ name: 'systemMenu' }` without a query.

- [ ] **Step 1: Write the failing Admin behavior regression test**

Create `apps/admin/tests/system-access-workspace.test.ts`:

```ts
import assert from 'node:assert/strict'
import test from 'node:test'

import systemRoutes from '../src/router/modules/system/index.ts'
import { useSystemAccessWorkspaceMode } from '../src/views/system/menu/workspace-mode.ts'

test('menu and resource modes stay inside the same page', () => {
  const state = useSystemAccessWorkspaceMode()
  assert.equal(state.mode.value, 'menus')

  state.search.value = '流言板'
  state.mobileDetailOpen.value = true
  state.switchMode('resources')

  assert.equal(state.mode.value, 'resources')
  assert.equal(state.search.value, '')
  assert.equal(state.mobileDetailOpen.value, false)
})

test('the legacy permission route redirects without selecting a routed view', () => {
  const permissionRoute = systemRoutes.children?.find(({ name }) => name === 'systemPermission')
  assert.deepEqual(permissionRoute?.redirect, { name: 'systemMenu' })
})
```

- [ ] **Step 2: Run the Admin test and verify RED**

Run: `node --test --experimental-strip-types apps/admin/tests/system-access-workspace.test.ts`

Expected: FAIL because `workspace-mode.ts` does not exist yet. After creating only that module to continue the red/green cycle, the compatibility-route assertion still fails because the redirect includes `view=resources`.

- [ ] **Step 3: Remove route coupling from the workspace**

Create `apps/admin/src/views/system/menu/workspace-mode.ts`:

```ts
import { ref } from 'vue'

export type SystemAccessWorkspaceMode = 'menus' | 'resources'

export function useSystemAccessWorkspaceMode() {
  const mode = ref<SystemAccessWorkspaceMode>('menus')
  const search = ref('')
  const mobileDetailOpen = ref(false)

  function switchMode(value: string | number | boolean | undefined) {
    mode.value = value === 'resources' ? 'resources' : 'menus'
    search.value = ''
    mobileDetailOpen.value = false
  }

  return { mobileDetailOpen, mode, search, switchMode }
}
```

In `apps/admin/src/views/system/menu/workspace.vue`:

- Delete `import { useRoute, useRouter } from 'vue-router'`.
- Delete `const route = useRoute()` and `const router = useRouter()`.
- Import `useSystemAccessWorkspaceMode` from `./workspace-mode`.
- Replace the route-derived mode, its watcher, and the separate `search` and `mobileDetailOpen` refs with:

```ts
const { mobileDetailOpen, mode, search, switchMode } = useSystemAccessWorkspaceMode()
```

- Delete the component-local `switchMode` function, including its `router.replace` call.

In `apps/admin/src/router/modules/system/index.ts`, change the compatibility redirect to:

```ts
redirect: { name: 'systemMenu' },
```

- [ ] **Step 4: Run the Admin test and verify GREEN**

Run: `node --test --experimental-strip-types apps/admin/tests/system-access-workspace.test.ts`

Expected: PASS with 2 tests and 0 failures.

### Task 2: Remove generated built-in Resource hints

**Files:**

- Modify: `apps/api/src/modules/system/rbac/rbac-sync.service.spec.ts`
- Modify: `apps/api/src/modules/system/rbac/builtins.ts`

**Interfaces:**

- Consumes: `BUILT_IN_RESOURCE_DEFINITIONS` and `RbacSyncService.syncBuiltIns()`.
- Produces: built-in Resource upserts with `description: ''`; custom Resource descriptions and API fields remain unchanged.

- [ ] **Step 1: Add a failing built-in Resource description assertion**

In the existing `upserts built-in permissions with localized Chinese names` test, after `await service.syncBuiltIns()`, add:

```ts
expect(prisma.resource.upsert).toHaveBeenCalledWith(
  expect.objectContaining({
    where: { key: 'content.rumorPost' },
    update: expect.objectContaining({ description: '' }),
    create: expect.objectContaining({ description: '' }),
  }),
)
```

- [ ] **Step 2: Run the focused API test and verify RED**

Run: `pnpm --filter @gaoge/app-api test -- rbac-sync.service.spec.ts --runInBand`

Expected: FAIL because the Resource currently synchronizes `description: '内容模块的流言板动态资源'`.

- [ ] **Step 3: Stop generating generic built-in descriptions**

In `apps/api/src/modules/system/rbac/builtins.ts`:

- Remove the now-unused `moduleLabels` constant.
- In `BUILT_IN_RESOURCE_DEFINITIONS`, replace the generated description expression with:

```ts
description: '',
```

Do not change `BuiltInResourceDefinition.description`, the Prisma schema, DTOs, services, or Admin conditional rendering.

- [ ] **Step 4: Run the focused API test and verify GREEN**

Run: `pnpm --filter @gaoge/app-api test -- rbac-sync.service.spec.ts --runInBand`

Expected: PASS with no failed assertions.

### Task 3: Verify the integrated correction

**Files:**

- No additional source files.

**Interfaces:**

- Consumes: the corrected Admin workspace, compatibility route, and built-in Resource catalog.
- Produces: verified same-page switching and absence of generic Resource hints without regressions.

- [ ] **Step 1: Run focused automated checks**

Run:

```bash
node --test --experimental-strip-types apps/admin/tests/system-access-workspace.test.ts apps/admin/tests/system-rbac-table.test.ts apps/admin/tests/fa-icon-resolver.test.ts
pnpm --filter @gaoge/app-api test -- rbac-sync.service.spec.ts navigation.service.spec.ts --runInBand
```

Expected: every test exits 0.

- [ ] **Step 2: Run package-level verification**

Run:

```bash
pnpm --filter @gaoge/app-admin typecheck
pnpm --filter @gaoge/app-api typecheck
pnpm --filter @gaoge/app-admin build
pnpm --filter @gaoge/app-api build
git diff --check
```

Expected: every command exits 0 and `git diff --check` prints no errors.

- [ ] **Step 3: Perform the runtime smoke check when the local services are available**

Synchronize built-ins through the existing authenticated local endpoint, then confirm in the Admin UI:

- Switching between “菜单结构” and “资源目录” leaves the URL at `/system/menu` and does not open or select another application tab.
- Opening `/system/permission` lands on `/system/menu`.
- Selecting `content.rumorPost` shows no “内容模块的流言板动态资源” summary.

If a signed-in local runtime is unavailable, report the missing runtime check explicitly without changing production or remote state.

- [ ] **Step 4: Commit the scoped correction**

Stage only these implementation paths:

```bash
git add apps/admin/tests/system-access-workspace.test.ts apps/admin/src/views/system/menu/workspace-mode.ts apps/admin/src/views/system/menu/workspace.vue apps/admin/src/router/modules/system/index.ts apps/api/src/modules/system/rbac/rbac-sync.service.spec.ts apps/api/src/modules/system/rbac/builtins.ts
git commit -m "fix(admin): align access workspace with reference"
```
