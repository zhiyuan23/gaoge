# Admin 服务端驱动导航 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让服务端 `Menu` 成为业务导航展示与排序的唯一运行时事实源，Admin 只通过受控 `routeName -> component` 注册表装配页面，并保证实际导航与“菜单与权限”树结构一致。

**Architecture:** API 保存并裁剪 `group / catalog / menu` 三类节点，通过 `/admin/navigation` 返回有序授权树；Admin 将该树分别投影为导航和 Vue Router 记录。共享契约只维护可执行页面键，不复制标题、图标、层级或排序；API Guard 继续承担最终授权。

**Tech Stack:** NestJS 11、Prisma 5、PostgreSQL、Vue 3、Vue Router、Pinia、TypeScript、Jest、Node test runner、pnpm/Turborepo

**Status:** 已实施并于 2026-08-26 通过数据库、API、Admin、浏览器与权限回归验证。

## Global Constraints

- 数据库 `Menu` 是业务菜单标题、图标、层级、排序、状态和显隐的运行时唯一事实源。
- 服务端不得下发任意源码组件路径；Admin 只能解析共享白名单中的 `routeName`。
- API Guard 是最终授权点，导航显隐不得替代服务端权限校验。
- 内置菜单的代码所有字段与数据库所有字段必须分开；普通同步不得覆盖管理员调整的标题、图标、排序、状态和显隐。
- API 与 Admin 保持独立发布兼容：先增量发布 API，再切换 Admin，最后清理旧投影逻辑。
- 本次只实施 `gaoge`；不得复制其他项目的业务菜单、Resource、Permission、Role、品牌或租户结构。
- 保留当前工作区既有 RBAC 修改；所有暂存和提交必须使用精确路径，不吸收无关修改。
- 不引入新 UI、状态管理或路由依赖，不实现微前端、远程组件或在线页面搭建。

---

### Task 1: 建立共享页面键与三类菜单契约

**Files:**

- Create: `packages/shared/types/src/admin-navigation.ts`
- Modify: `packages/shared/types/src/index.ts`
- Modify: `packages/shared/types/src/system-menu.ts`
- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/20260826120000_add_server_driven_navigation/migration.sql`
- Modify: `apps/api/src/modules/system/menu/dto/create-system-menu.dto.ts`
- Modify: `apps/api/src/modules/system/menu/dto/update-system-menu.dto.ts`
- Modify: `apps/api/src/modules/system/menu/system-menu.service.ts`
- Modify: `apps/api/src/modules/system/menu/system-menu-configuration.service.ts`
- Test: `apps/api/src/modules/system/menu/system-menu.service.spec.ts`
- Test: `apps/api/src/modules/system/menu/system-menu-configuration.service.spec.ts`

**Interfaces:**

- Produces: `ADMIN_PAGE_ROUTE_NAMES`, `AdminPageRouteName`, `AdminNavigationNode`, `SystemMenuType = 'group' | 'catalog' | 'menu'`。
- Produces: `SystemMenu.path`、Create/Update payload 的 `path` 为 `string | null`。
- Produces: 数据库 `Menu.path String?`；只有 `group` 可为空。

- [ ] **Step 1: 写共享契约的失败编译用例和菜单校验测试**

在 `admin-navigation.ts` 定义目标形状，但先不导出；在配置服务测试中加入：

```ts
it('accepts a pathless navigation group', async () => {
  await service.create({
    parentId: null,
    name: 'systemManagement',
    title: '系统管理',
    path: null,
    routeName: 'systemManagement',
    menuType: 'group',
    sort: 10,
    status: 'active',
    visible: true,
    resourceIds: [],
  })
  expect(prisma.$transaction).toHaveBeenCalled()
})

it.each(['catalog', 'menu'] as const)('rejects an empty path for %s', async (menuType) => {
  await expect(
    service.create({
      parentId: null,
      name: 'invalid',
      title: '无效菜单',
      path: null,
      routeName: 'player',
      menuType,
      status: 'active',
      visible: true,
      resourceIds: [],
    }),
  ).rejects.toThrow('只有导航分组允许空路径')
})

it('rejects a page routeName outside the compiled Admin registry', async () => {
  await expect(
    service.create({
      parentId: 1,
      name: 'unknownPage',
      title: '未知页面',
      path: '/unknown',
      routeName: 'unknownPage',
      menuType: 'menu',
      status: 'active',
      visible: true,
      resourceIds: [],
    }),
  ).rejects.toThrow('页面路由未在当前 Admin 版本注册')
})
```

- [ ] **Step 2: 运行测试和类型检查，确认旧契约失败**

Run:

```bash
pnpm --filter @gaoge/shared-types typecheck
pnpm --filter @gaoge/app-api test -- system-menu.service.spec.ts system-menu-configuration.service.spec.ts --runInBand
```

Expected: `group`、`path: null` 或未导出的共享符号导致失败。

- [ ] **Step 3: 实现共享契约**

`admin-navigation.ts` 使用唯一页面键数组：

```ts
export const ADMIN_PAGE_ROUTE_NAMES = [
  'player',
  'team',
  'matchRound',
  'assetRecord',
  'contentBanner',
  'contentRumorPost',
  'systemUser',
  'systemRole',
  'systemMenu',
  'systemAudit',
  'wechatShare',
] as const

export type AdminPageRouteName = (typeof ADMIN_PAGE_ROUTE_NAMES)[number]

export interface AdminNavigationNode {
  routeName: string
  type: 'group' | 'catalog' | 'menu'
  path: string | null
  title: string
  icon: string | null
  children: AdminNavigationNode[]
}
```

同步更新 `SystemMenu`、Create/Update payload，并从 `index.ts` 导出。

- [ ] **Step 4: 修改 Prisma 与 DTO/服务条件校验**

Schema 改为：

```prisma
path String?
```

Migration 只执行：

```sql
ALTER TABLE "Menu" ALTER COLUMN "path" DROP NOT NULL;
```

DTO 允许 `path?: string | null`，菜单服务统一执行：

```ts
if (menuType === 'group' && path !== null) {
  throw new BadRequestException('导航分组不能配置路径')
}
if (menuType !== 'group' && !path) {
  throw new BadRequestException('只有导航分组允许空路径')
}
```

并禁止 `group` 关联 Resource。

对 `menu` 使用运行时白名单校验：

```ts
if (menuType === 'menu' && !ADMIN_PAGE_ROUTE_NAMES.includes(routeName as AdminPageRouteName)) {
  throw new BadRequestException('页面路由未在当前 Admin 版本注册')
}
```

- [ ] **Step 5: 验证共享契约和服务测试通过**

Run:

```bash
pnpm --filter @gaoge/shared-types typecheck
pnpm --filter @gaoge/app-api exec prisma validate
pnpm --filter @gaoge/app-api test -- system-menu.service.spec.ts system-menu-configuration.service.spec.ts --runInBand
```

Expected: 全部退出码为 `0`。

- [ ] **Step 6: 创建路径级检查点提交**

```bash
git add packages/shared/types/src/admin-navigation.ts packages/shared/types/src/index.ts packages/shared/types/src/system-menu.ts apps/api/prisma/schema.prisma apps/api/prisma/migrations/20260826120000_add_server_driven_navigation/migration.sql apps/api/src/modules/system/menu/dto/create-system-menu.dto.ts apps/api/src/modules/system/menu/dto/update-system-menu.dto.ts apps/api/src/modules/system/menu/system-menu.service.ts apps/api/src/modules/system/menu/system-menu.service.spec.ts apps/api/src/modules/system/menu/system-menu-configuration.service.ts apps/api/src/modules/system/menu/system-menu-configuration.service.spec.ts
git commit -m "feat(rbac): add server navigation contract"
```

---

### Task 2: 重建内置导航树并保护管理员展示配置

**Files:**

- Modify: `apps/api/src/modules/system/rbac/builtins.ts`
- Modify: `apps/api/src/modules/system/rbac/rbac-sync.service.ts`
- Test: `apps/api/src/modules/system/rbac/rbac-sync.service.spec.ts`
- Modify: `apps/admin/src/views/system/menu/components/SystemMenuConfigurationDialog.vue`
- Modify: `apps/admin/src/views/system/menu/components/system-access-forms.ts`
- Modify: `apps/admin/src/views/system/menu/constants.ts`

**Interfaces:**

- Consumes: `SystemMenuType` 与可空 `path`。
- Produces: 根节点 `sports`、`systemManagement` 为 `group`；`system`、`wechat` 位于 `systemManagement` 下。
- Produces: 内置同步保留 `title/icon/sort/status/visible`，修复 `parentId/name/path/routeName/menuType/isBuiltIn` 与默认 Resource 绑定。

- [ ] **Step 1: 写失败的内置树和字段所有权测试**

在 `rbac-sync.service.spec.ts` 增加断言：

```ts
it('creates the shared navigation groups in product order', async () => {
  await service.syncBuiltIns()
  const menuUpserts = prisma.menu.upsert.mock.calls.map(([argument]) => argument)
  const findCreate = (routeName: string) =>
    menuUpserts.find((argument) => argument.where.routeName === routeName)?.create
  expect(menuUpserts.map((call) => call.create.routeName)).toEqual(
    expect.arrayContaining(['sports', 'systemManagement', 'system', 'wechat']),
  )
  expect(findCreate('sports')).toMatchObject({ menuType: 'group', path: null, sort: 0 })
  expect(findCreate('systemManagement')).toMatchObject({
    menuType: 'group',
    path: null,
    sort: 10,
  })
})

it('preserves administrator-owned presentation fields on existing built-ins', async () => {
  await service.syncBuiltIns()
  const menuUpserts = prisma.menu.upsert.mock.calls.map(([argument]) => argument)
  const findUpdate = (routeName: string) =>
    menuUpserts.find((argument) => argument.where.routeName === routeName)?.update ?? {}
  expect(findUpdate('sports')).not.toHaveProperty('title')
  expect(findUpdate('sports')).not.toHaveProperty('icon')
  expect(findUpdate('sports')).not.toHaveProperty('sort')
  expect(findUpdate('sports')).not.toHaveProperty('status')
  expect(findUpdate('sports')).not.toHaveProperty('visible')
})
```

- [ ] **Step 2: 运行 RBAC 测试确认失败**

Run:

```bash
pnpm --filter @gaoge/app-api test -- rbac-sync.service.spec.ts --runInBand
```

Expected: 当前根节点和 update payload 不满足断言。

- [ ] **Step 3: 实现目标内置树**

使用以下一级结构：

先把当前 `routeName` 为 `sportsFootball`、`sportsContent`、`system`、`wechat` 的完整对象提取为 `footballCatalog`、`contentCatalog`、`systemCatalog`、`wechatCatalog` 四个局部常量，再改变父级装配。页面路径和 Resource 绑定保持不变；为匹配迁移前实际前端菜单，`contentBanner.sort` 设为 `0`，`contentRumorPost.sort` 设为 `10`。

```ts
;[
  {
    name: 'sports',
    title: '高歌体育',
    path: null,
    routeName: 'sports',
    menuType: 'group',
    sort: 0,
    children: [footballCatalog, contentCatalog],
  },
  {
    name: 'systemManagement',
    title: '系统管理',
    path: null,
    routeName: 'systemManagement',
    menuType: 'group',
    sort: 10,
    children: [systemCatalog, wechatCatalog],
  },
]
```

保持具体页面的现有 `routeName`、绝对路径和 Resource 关联不变。

- [ ] **Step 4: 修改同步 update 字段边界**

已有内置菜单只更新：

```ts
update: {
  parentId,
  name: menu.name,
  path: menu.path,
  menuType: menu.menuType,
  isBuiltIn: true,
}
```

`routeName` 是 upsert 唯一键，无需重复更新。`create` 继续使用全部默认字段；MenuResource 继续按代码默认值精确重建。

- [ ] **Step 5: 收紧内置菜单编辑表单**

内置菜单编辑时将 `parentId/name/path/routeName/menuType/resourceIds` 设为只读或禁用，只允许修改 `title/icon/sort/status/visible`。菜单类型选项加入 `group`，父级候选同时包含 `group` 和 `catalog`。表单提示改为：

```text
内置菜单的标识、类型、路径、父级和资源绑定由版本控制；标题、图标、排序、状态和显隐可在此配置。
```

- [ ] **Step 6: 运行聚焦验证**

Run:

```bash
pnpm --filter @gaoge/app-api test -- rbac-sync.service.spec.ts system-menu-configuration.service.spec.ts --runInBand
pnpm --filter @gaoge/app-admin typecheck
```

Expected: 全部退出码为 `0`。

- [ ] **Step 7: 创建路径级检查点提交**

```bash
git add apps/api/src/modules/system/rbac/builtins.ts apps/api/src/modules/system/rbac/rbac-sync.service.ts apps/api/src/modules/system/rbac/rbac-sync.service.spec.ts apps/admin/src/views/system/menu/components/SystemMenuConfigurationDialog.vue apps/admin/src/views/system/menu/components/system-access-forms.ts apps/admin/src/views/system/menu/constants.ts
git commit -m "feat(rbac): make navigation groups server-owned"
```

---

### Task 3: 让导航 API 返回同一棵授权树

**Files:**

- Modify: `apps/api/src/modules/navigation/navigation.service.ts`
- Test: `apps/api/src/modules/navigation/navigation.service.spec.ts`
- Modify: `apps/admin/src/api/app/index.ts`

**Interfaces:**

- Consumes: `AdminNavigationNode`。
- Produces: `NavigationService.getVisibleMenus(userId): Promise<AdminNavigationNode[]>`，同时保留旧客户端需要的 `name/meta/children` 字段。

- [ ] **Step 1: 写排序、分组和空节点裁剪测试**

构造乱序输入并断言：

```ts
expect(result.map((node) => node.routeName)).toEqual(['sports', 'systemManagement'])
expect(result[1]).toMatchObject({
  type: 'group',
  path: null,
  children: [
    { routeName: 'system', type: 'catalog' },
    { routeName: 'wechat', type: 'catalog' },
  ],
})
```

再增加无权限页面被移除后，空 `catalog/group` 一并移除的断言。

- [ ] **Step 2: 运行导航测试确认失败**

Run:

```bash
pnpm --filter @gaoge/app-api test -- navigation.service.spec.ts --runInBand
```

Expected: 缺少 `type/routeName` 或根分组顺序错误。

- [ ] **Step 3: 实现类型化导航投影**

每个返回节点保持兼容字段并增加显式契约：

```ts
return {
  routeName: menu.routeName,
  type: menu.menuType,
  path: menu.path,
  title: menu.title,
  icon: menu.icon,
  name: menu.routeName,
  meta: { title: menu.title, icon: menu.icon ?? undefined },
  children,
}
```

在组装 `childrenByParentId` 后对每组执行：

```ts
children.sort((left, right) => left.sort - right.sort || left.id - right.id)
```

避免依赖全表排序的隐含副作用。

- [ ] **Step 4: 给 Admin API 添加准确返回类型**

```ts
menuList: () => api.get<AdminNavigationNode[]>('admin/navigation')
```

删除 `unknown[]`，暂时保留未使用的 mock `routeList` 到 Task 6 清理。

- [ ] **Step 5: 运行测试和类型检查**

Run:

```bash
pnpm --filter @gaoge/app-api test -- navigation.service.spec.ts --runInBand
pnpm --filter @gaoge/app-api typecheck
pnpm --filter @gaoge/app-admin typecheck
```

Expected: 全部退出码为 `0`。

- [ ] **Step 6: 创建路径级检查点提交**

```bash
git add apps/api/src/modules/navigation/navigation.service.ts apps/api/src/modules/navigation/navigation.service.spec.ts apps/admin/src/api/app/index.ts
git commit -m "feat(api): return authorized navigation tree"
```

---

### Task 4: 建立前端组件注册表和纯导航转换器

**Files:**

- Create: `apps/admin/src/router/admin-page-registry.ts`
- Create: `apps/admin/src/router/server-navigation.ts`
- Test: `apps/admin/tests/server-navigation.test.ts`

**Interfaces:**

- Consumes: `AdminNavigationNode`、`AdminPageRouteName`。
- Produces: `adminPageRegistry: Record<AdminPageRouteName, ComponentLoader>`。
- Produces: `resolveServerNavigation(nodes): { menus: Menu.recordMainRaw[]; routes: Route.recordMainRaw[]; diagnostics: string[] }`。

- [ ] **Step 1: 写纯转换器失败测试**

覆盖三类行为：

```ts
import { readFileSync } from 'node:fs'
import type { RouteRecordRaw } from 'vue-router'

import type { AdminNavigationNode } from '@gaoge/shared-types'

const serverTree: AdminNavigationNode[] = [
  {
    routeName: 'sports',
    type: 'group',
    path: null,
    title: '高歌体育',
    icon: 'solar:cup-star-outline',
    children: [
      {
        routeName: 'sportsFootball',
        type: 'catalog',
        path: '/sports/football',
        title: '高歌 FC',
        icon: 'proicons:soccer',
        children: [
          {
            routeName: 'player',
            type: 'menu',
            path: '/sports/football/player',
            title: '球员信息',
            icon: null,
            children: [],
          },
        ],
      },
    ],
  },
  {
    routeName: 'systemManagement',
    type: 'group',
    path: null,
    title: '系统管理',
    icon: 'ri:settings-3-line',
    children: [
      {
        routeName: 'system',
        type: 'catalog',
        path: '/system',
        title: '用户权限',
        icon: 'ri:settings-3-line',
        children: [
          {
            routeName: 'systemUser',
            type: 'menu',
            path: '/system/user',
            title: '用户管理',
            icon: null,
            children: [],
          },
        ],
      },
    ],
  },
]

const unknownLeafTree: AdminNavigationNode = {
  routeName: 'unknownGroup',
  type: 'group',
  path: null,
  title: '未知分组',
  icon: null,
  children: [
    {
      routeName: 'unknownPage',
      type: 'menu',
      path: '/unknown',
      title: '未知页面',
      icon: null,
      children: [],
    },
  ],
}

function findRoute(routes: Route.recordMainRaw[], name: string): RouteRecordRaw | undefined {
  const queue = routes.flatMap((item) => item.children)
  while (queue.length > 0) {
    const route = queue.shift()!
    if (route.name === name) return route
    queue.push(...(route.children ?? []))
  }
  return undefined
}

test('preserves server group and sibling order', () => {
  const result = resolveServerNavigation(serverTree)
  assert.deepEqual(
    result.menus.map((item) => item.meta?.title),
    ['高歌体育', '系统管理'],
  )
})

test('maps a registered page route to its component', () => {
  const result = resolveServerNavigation(serverTree)
  assert.equal(findRoute(result.routes, 'player')?.path, '/sports/football/player')
  assert.equal(typeof findRoute(result.routes, 'player')?.component, 'function')
})

test('fails closed for an unknown page route', () => {
  const result = resolveServerNavigation([unknownLeafTree])
  assert.equal(findRoute(result.routes, 'unknownPage'), undefined)
  assert.deepEqual(result.menus, [])
  assert.match(result.diagnostics[0], /unknownPage/)
})
```

- [ ] **Step 2: 运行 Node 测试确认文件或函数不存在**

Run:

```bash
node --test --experimental-strip-types apps/admin/tests/server-navigation.test.ts
```

Expected: module 或导出不存在。

- [ ] **Step 3: 实现完整页面注册表**

注册表必须是完整 Record：

```ts
export const adminPageRegistry: Record<AdminPageRouteName, ComponentLoader> = {
  player: () => import('@/views/sports/football/player/index.vue'),
  team: () => import('@/views/sports/football/team/index.vue'),
  matchRound: () => import('@/views/sports/football/match-round/index.vue'),
  assetRecord: () => import('@/views/sports/football/asset-record/index.vue'),
  contentBanner: () => import('@/views/sports/content/banner/index.vue'),
  contentRumorPost: () => import('@/views/sports/content/rumor-post/index.vue'),
  systemUser: () => import('@/views/system/user/workspace.vue'),
  systemRole: () => import('@/views/system/role/workspace.vue'),
  systemMenu: () => import('@/views/system/menu/workspace.vue'),
  systemAudit: () => import('@/views/system/audit/index.vue'),
  wechatShare: () => import('@/views/system/wechat-share/index.vue'),
}
```

同文件定义：

```ts
export type ComponentLoader = NonNullable<RouteRecordRaw['component']>
```

- [ ] **Step 4: 实现无副作用转换器**

规则固定为：

```ts
group   -> 只生成主导航节点，不生成 Vue Route
catalog -> 生成 Layout Route，并递归挂载有效 children
menu    -> 通过 adminPageRegistry 生成页面 Route
unknown -> diagnostics + 丢弃；父节点无有效 children 时同步裁剪
```

路由统一使用服务端绝对 `path`，标题和图标只来自服务端；catalog 默认重定向到第一个有效后代页面。

- [ ] **Step 5: 运行转换器测试和 Admin typecheck**

Run:

```bash
node --test --experimental-strip-types apps/admin/tests/server-navigation.test.ts
pnpm --filter @gaoge/app-admin typecheck
```

Expected: 全部退出码为 `0`。

- [ ] **Step 6: 创建路径级检查点提交**

```bash
git add apps/admin/src/router/admin-page-registry.ts apps/admin/src/router/server-navigation.ts apps/admin/tests/server-navigation.test.ts
git commit -m "feat(admin): add controlled page registry"
```

---

### Task 5: 接入登录守卫、Route Store 和 Menu Store

**Files:**

- Modify: `apps/admin/src/router/guards.ts`
- Modify: `apps/admin/src/store/route/index.ts`
- Modify: `apps/admin/src/store/menu/index.ts`
- Modify: `apps/admin/src/settings.ts`
- Test: `apps/admin/tests/server-navigation.test.ts`

**Interfaces:**

- Consumes: `resolveServerNavigation()` 返回值。
- Produces: `routeStore.generateRoutesFromServer(routes)` 与 `menuStore.setServerMenus(menus)`。
- Produces: 登录初始化只请求一次 `/admin/navigation`。

- [ ] **Step 1: 扩充集成状态测试**

在纯测试中固定一次转换结果可以同时供 Route 与 Menu 使用，并断言菜单标题来自服务端而不是旧路由 meta：

```ts
const serverTreeWithRenamedTitle = structuredClone(serverTree)
serverTreeWithRenamedTitle[0].title = '体育运营'
serverTreeWithRenamedTitle[0].children[0].children[0].title = '球员档案'
const result = resolveServerNavigation(serverTreeWithRenamedTitle)
assert.equal(result.menus[0].meta?.title, '体育运营')
assert.equal(findRoute(result.routes, 'player')?.meta?.title, '球员档案')

const routeStoreSource = readFileSync(
  new URL('../src/store/route/index.ts', import.meta.url),
  'utf8',
)
const menuStoreSource = readFileSync(new URL('../src/store/menu/index.ts', import.meta.url), 'utf8')
assert.match(routeStoreSource, /generateRoutesFromServer/)
assert.match(menuStoreSource, /setServerMenus/)
```

- [ ] **Step 2: 运行测试并确认旧 Store 尚未接入**

Run:

```bash
node --test --experimental-strip-types apps/admin/tests/server-navigation.test.ts
```

Expected: Store 尚无目标方法，静态断言失败。

- [ ] **Step 3: 增加显式 Store setter**

Route Store：

```ts
function generateRoutesFromServer(routes: Route.recordMainRaw[]) {
  routesRaw.value = cloneDeep(routes)
  isGenerate.value = true
}
```

Menu Store：

```ts
function setServerMenus(menus: Menu.recordMainRaw[]) {
  serverMenusRaw.value = cloneDeep(menus)
}
```

`allMenus` 在服务端模式直接使用 `serverMenusRaw`，不再按路径投影本地路由，也不再对已经由服务端授权的菜单重复执行 `meta.auth` 过滤。

- [ ] **Step 4: 改造登录守卫为单次服务端导航初始化**

后端模式执行：

```ts
const navigation = await apiApp.menuList()
const resolved = resolveServerNavigation(navigation)
routeStore.generateRoutesFromServer(resolved.routes)
menuStore.setServerMenus(resolved.menus)
if (resolved.diagnostics.length > 0) {
  console.error('[Gaoge Admin] 服务端导航存在未注册页面', resolved.diagnostics)
  ElMessage.error('部分菜单配置与当前前端版本不匹配，已安全隐藏。')
}
```

将 `settings.ts` 明确设为：

```ts
app: {
  enablePermission: true,
  enableDynamicTitle: true,
  routeBaseOn: 'backend',
}
```

- [ ] **Step 5: 运行 Admin 聚焦测试和类型检查**

Run:

```bash
node --test --experimental-strip-types apps/admin/tests/server-navigation.test.ts apps/admin/tests/fa-icon-resolver.test.ts apps/admin/tests/system-rbac-table.test.ts
pnpm --filter @gaoge/app-admin typecheck
```

Expected: 全部退出码为 `0`。

- [ ] **Step 6: 创建路径级检查点提交**

```bash
git add apps/admin/src/router/guards.ts apps/admin/src/store/route/index.ts apps/admin/src/store/menu/index.ts apps/admin/src/settings.ts apps/admin/tests/server-navigation.test.ts
git commit -m "feat(admin): drive routes and menus from server"
```

---

### Task 6: 清理重复业务菜单定义并固化项目规范

**Files:**

- Modify: `apps/admin/src/router/routes.ts`
- Delete: `apps/admin/src/router/modules/sports/index.ts`
- Delete: `apps/admin/src/router/modules/sports/football.ts`
- Delete: `apps/admin/src/router/modules/sports/content.ts`
- Delete: `apps/admin/src/router/modules/system/index.ts`
- Delete: `apps/admin/src/router/modules/system/wechat-share.ts`
- Delete: `apps/admin/src/router/modules/wechat/index.ts`
- Modify: `apps/admin/src/api/app/index.ts`
- Create: `apps/admin/src/router/fixed-hidden-routes.ts`
- Create: `docs/conventions/admin-navigation.md`
- Modify: `docs/conventions/README.md`
- Modify: `AGENTS.md`
- Test: `apps/admin/tests/server-navigation.test.ts`

**Interfaces:**

- Consumes: 服务端导航转换与页面注册表。
- Produces: 前端不再保存业务标题、图标、层级和排序；只保留固定路由与 `systemPermission` 兼容跳转。

- [ ] **Step 1: 增加静态防重复测试**

在 `server-navigation.test.ts` 中读取 `router/routes.ts` 并断言不再导入业务菜单模块：

```ts
const routesSource = readFileSync(new URL('../src/router/routes.ts', import.meta.url), 'utf8')
assert.doesNotMatch(routesSource, /modules\/sports/)
assert.doesNotMatch(routesSource, /modules\/system/)
assert.doesNotMatch(routesSource, /modules\/wechat/)
```

同时断言固定隐藏路由仍包含 `systemPermission`。

- [ ] **Step 2: 运行测试确认旧定义仍存在**

Run:

```bash
node --test --experimental-strip-types apps/admin/tests/server-navigation.test.ts
```

Expected: `routes.ts` 仍导入 Sports/System/Wechat，测试失败。

- [ ] **Step 3: 移除重复业务路由模块**

从 `asyncRoutes` 删除 Sports/System/Wechat 业务菜单；页面 component loader 已迁入 `admin-page-registry.ts`。删除六个不再有调用方的业务路由文件，保留示例/测试模块现状，不顺手清理。

`fixed-hidden-routes.ts` 只保留：

```ts
export const fixedHiddenRoutes: RouteRecordRaw[] = [
  {
    path: '/system/permission',
    name: 'systemPermission',
    redirect: { name: 'systemMenu', query: { view: 'resources' } },
    meta: { menu: false, breadcrumb: false, auth: ['system.permission.view'] },
  },
]
```

在 `routes.ts` 中将 `fixedHiddenRoutes` 合并到 `systemRoutes`，确保兼容跳转仍被 `flatSystemRoutes` 注册。

- [ ] **Step 4: 删除旧后端 mock 路由入口与路径白名单投影**

删除 `apiApp.routeList()`、`generateRoutesAtBack()` 的 `/mock/app/route/list` 分支，以及 Menu Store 中：

```ts
backendVisiblePaths
collectMenuPaths
projectMenusByVisiblePaths
projectMenuChildren
```

保留 filesystem 模式所需代码，不重构无关框架能力。

- [ ] **Step 5: 写 Admin 导航规范**

`docs/conventions/admin-navigation.md` 必须明确：

```text
- 服务端 Menu 管标题、图标、结构、排序、状态和显隐。
- 前端 admin-page-registry 只管 routeName 到组件。
- 新页面先加入 ADMIN_PAGE_ROUTE_NAMES 和组件注册表，再配置服务端菜单。
- group 不对应路由，catalog 使用 Layout，menu 必须注册组件。
- 业务菜单不得重新写入 router/modules；API Guard 始终是最终授权点。
- 跨 Gaoge 仓库只同步机制和测试，业务菜单树按项目适配。
```

从 `docs/conventions/README.md` 和 `AGENTS.md` 的规范入口链接该文件。

- [ ] **Step 6: 运行清理验证**

Run:

```bash
node --test --experimental-strip-types apps/admin/tests/server-navigation.test.ts
pnpm --filter @gaoge/app-admin typecheck
pnpm --filter @gaoge/app-admin build
git diff --check
```

Expected: 全部退出码为 `0`，生产构建仍生成全部业务页面 chunk。

- [ ] **Step 7: 创建路径级检查点提交**

```bash
git add apps/admin/src/router/routes.ts apps/admin/src/router/modules/sports apps/admin/src/router/modules/system apps/admin/src/router/modules/wechat apps/admin/src/api/app/index.ts apps/admin/src/router/fixed-hidden-routes.ts apps/admin/src/store/route/index.ts apps/admin/src/store/menu/index.ts apps/admin/tests/server-navigation.test.ts docs/conventions/admin-navigation.md docs/conventions/README.md AGENTS.md
git commit -m "refactor(admin): remove duplicate business menu metadata"
```

---

### Task 7: 同步数据库并完成端到端验收

**Files:**

- Verify: `apps/api/prisma/migrations/20260826120000_add_server_driven_navigation/migration.sql`
- Verify: `apps/api/src/modules/system/rbac/builtins.ts`
- Verify: `apps/admin/src/router/admin-page-registry.ts`
- Verify: `docs/superpowers/specs/2026-08-26-server-driven-admin-navigation-design.md`
- Verify: `docs/superpowers/plans/2026-08-26-server-driven-admin-navigation.md`

**Interfaces:**

- Consumes: 前六个任务的完整实现。
- Produces: 新鲜的数据库、API、Admin、浏览器和权限回归证据。

- [ ] **Step 1: 运行 Prisma 与共享类型门禁**

```bash
pnpm --filter @gaoge/app-api exec prisma validate
pnpm --filter @gaoge/app-api db:generate
pnpm --filter @gaoge/shared-types typecheck
```

Expected: 全部退出码为 `0`。

- [ ] **Step 2: 迁移本地数据库并同步内置配置**

```bash
pnpm --filter @gaoge/app-api exec prisma migrate dev
pnpm --filter @gaoge/app-api db:seed
pnpm --filter @gaoge/app-api exec prisma migrate status
```

Expected: migration applied，seed 输出包含目标菜单数量，migrate status 显示数据库已同步。若 `127.0.0.1:5432` 未运行，先启动项目约定的本地 PostgreSQL，不改用远程或生产数据库。

- [ ] **Step 3: 运行 API 聚焦与全量测试**

```bash
pnpm --filter @gaoge/app-api test -- rbac-sync.service.spec.ts navigation.service.spec.ts system-menu-configuration.service.spec.ts system-menu.service.spec.ts permissions.guard.spec.ts --runInBand
pnpm --filter @gaoge/app-api test -- --runInBand
pnpm --filter @gaoge/app-api typecheck
pnpm --filter @gaoge/app-api build
```

Expected: Jest `0` failures，typecheck/build 退出码为 `0`。

- [ ] **Step 4: 运行 Admin 聚焦与全量门禁**

```bash
node --test --experimental-strip-types apps/admin/tests/server-navigation.test.ts apps/admin/tests/fa-icon-resolver.test.ts apps/admin/tests/system-rbac-table.test.ts
pnpm --filter @gaoge/app-admin typecheck
pnpm --filter @gaoge/app-admin build
pnpm lint
git diff --check
```

Expected: 全部退出码为 `0`；若根 lint 发现任务前既有失败，记录文件和证据，确认本次路径无新增失败。

- [ ] **Step 5: 重启 API/Admin 并做接口 smoke test**

启动最新进程后，使用管理员会话请求：

```text
GET /admin/navigation
GET /system/access-catalog
```

断言 `/admin/navigation` 一级顺序为 `sports, systemManagement`，`systemManagement` 子级为 `system, wechat`；两接口的同级 `routeName` 顺序一致。

- [ ] **Step 6: 做管理员浏览器回归**

检查：

```text
主导航：高歌体育 → 系统管理
高歌体育：高歌 FC → 球员信息、球队信息、比赛信息、资产信息；内容管理 → Banner 管理、流言板
系统管理：用户权限 → 用户管理、角色管理、菜单与权限、审计日志；微信管理 → 微信分享配置
菜单与权限树：结构和顺序与实际导航一致
标题/图标/排序修改：刷新后生效；同步内置配置后仍保留
浏览器控制台：无未注册 routeName、重复路由或图标加载错误
```

- [ ] **Step 7: 做受限角色和直接访问回归**

使用缺少部分 `view` 权限的账号验证对应页面和空目录被裁剪；直接打开被裁剪 URL 不注册目标路由；直接请求受保护 API 返回 `403`。

- [ ] **Step 8: 复核实现范围并整理功能提交**

```bash
git status --short
git diff --stat
git diff --check
```

确认没有未来占位能力、无调用方抽象、其他仓库业务配置或无关清理。将设计文档状态更新为“已实施并通过验证”，在计划末尾记录实际验证命令和结果。按 AGENTS.md 规则整理尚未共享的临时检查点；仅在完整验证后形成文档收尾提交：

```bash
git add docs/superpowers/specs/2026-08-26-server-driven-admin-navigation-design.md docs/superpowers/plans/2026-08-26-server-driven-admin-navigation.md
git commit -m "docs(admin): record server navigation verification"
```

---

## Knowledge and Cross-Repository Follow-up

- 本计划实施完成前，知识库只能记录“已确认设计与同步约束”，不得写成已实施事实。
- 实施完成并获得新鲜验证后，通过 `kb-maintainer` 将 `gaoge` 更新为新的可验证 CURRENT，并更新源码修订证据。
- 后续同步活动成员时，重新执行 `gaoge-admin-sync` / RBAC 同步流程：Discover membership → Snapshot → BASE/CURRENT → Classify → Recheck → Verify → Report。
- 跨仓只同步服务端菜单事实源、受控组件注册表、失败关闭、内置字段所有权和一致性测试；每个项目分别维护业务菜单树、页面键、Resource 绑定、品牌、租户与部署配置。

## Task 7 实际验证结果（2026-08-26）

- Prisma 与数据库：`prisma validate`、`db:generate`、共享类型 typecheck 均通过；在项目约定的本地 PostgreSQL `127.0.0.1:5432/gaoge_task7_navigation_v2` 上从空库应用 27 个 migration，`db:seed` 输出 `menus=17`，最终 `prisma migrate status` 为 `Database schema is up to date!`。Resource 迁移空库、既有合法数据和非法数据 drill 均通过。
- API：计划中的 `pnpm ... test -- ... --runInBand` 会把 `--runInBand` 误当 Jest pattern，因此改用等价的 `pnpm --filter @gaoge/app-api exec jest ... --runInBand`；指定 5 个 suite 为 27 tests 通过，全量为 41 suites / 221 tests 通过，API typecheck/build 通过。
- Admin：指定 Node 测试为 21 tests 通过，Admin typecheck/build 通过。`pnpm lint:style` 和任务路径 ESLint 通过；根 `pnpm lint` 仅命中既有 `.worktrees/release-lifecycle-governance`：212 个文件、461 errors、7 warnings，仓库其余路径为 0 个文件、0 errors、0 warnings。
- 接口 smoke：最新隔离进程运行于 API `127.0.0.1:3122`、Admin `127.0.0.1:9012`；管理员 `/admin/navigation` 一级为 `sports, systemManagement`、系统子级为 `system, wechat`，与 `/system/access-catalog` 同级 `routeName` 顺序一致。
- 管理员浏览器：主导航、两棵侧栏目录和“菜单与权限”树的结构/顺序符合设计；`systemPermission` 兼容地址重定向到 `/system/menu?view=resources`；临时把内置 `systemManagement` 改为标题“系统管理验收”、图标 `ri:shield-check-line`、排序 20 后刷新生效，重复内置同步仍保留，验收后已恢复为“系统管理”/空图标/排序 10。
- 权限回归：仅有 `football.player.view` 的自定义角色登录后只看到“高歌体育 → 高歌 FC → 球员信息”，直接打开 `/system/user` 呈现 404；`GET /system/users` 按现有全局响应约定返回 HTTP 200 包络、应用码 `403`。浏览器验收发现并修复了 legacy `RolesGuard` 阻止自定义角色读取自身 `/auth/permission` 的问题，并加入控制器 metadata 回归测试。
- 控制台：管理员与受限角色的全新 Chrome 标签均无未注册 `routeName`、重复路由、图标加载或其他 error；仅保留既有 Vue Router `next()` callback deprecation warning。
- 证据：详细命令、输出摘要、提交范围和截图清单位于 `.superpowers/sdd/2026-08-26-server-driven-admin-navigation/task-7-report.md`。

## Task 7 Review Round 1 复验结果（2026-08-26）

- 数据库：新建且仅使用本地隔离库 `gaoge_task7_navigation_r2_20260826`；`migrate dev` 从空库应用 27 个 migration，seed 为 `roles=2, permissions=57, menus=17`，最终 status 为 up to date。Resource drill 继续覆盖空库/既有/非法数据；新增导航 drill 覆盖空库 deploy 与既有旧树 deploy（不运行 seed），确认两个 group、四个 catalog 精确重挂且既有展示字段及 `updatedAt` 不变。
- API：业务 controller 不再存在 `RolesGuard/@Roles`；legacy `role=admin` 且只有 `football.player.view` 的 HTTP fixture 对球员同资源 POST/PATCH/DELETE，以及球队、比赛、资产、资金、Banner、流言板、微信跨资源写入均返回应用码 403。最终全量为 43 suites / 248 tests，API typecheck/build 通过。
- 字段所有权：内置菜单结构/Resource 绕过请求返回应用码 400，展示字段更新成功；重复同步两次保留 title/icon/sort/status/visible。运行时发现并修复空字符串无法清除 icon，以及内置同步会按 legacy `admin` 给 API 管理用户追加 `super_admin`；两项均有回归测试。
- 真实 fixture：角色 `task7_player_viewer_r2` 和用户 `task7restrictedr2` 均通过 System Role/User API 创建与分配；数据库确认 `legacy_role=admin`，显式角色仅为该自定义角色，Permission 仅 `football.player.view`。修复后重复同步两次仍保持该状态。
- Admin/共享：Admin 指定 Node 测试 21/21、typecheck/build 通过；共享类型 typecheck 自动运行 CJS/`.d.cts` 同序一致 gate（2/2）。任务路径 ESLint、Prettier、Stylelint 和 diff check 全部通过；根 lint 的既有非零证据仍仅位于 `.worktrees/release-lifecycle-governance`。
- 最新隔离运行时：API `127.0.0.1:3123`、Admin `127.0.0.1:9013`。管理员 navigation/catalog 均应用码 0；`systemPermission` 打开 `/system/menu?view=resources`。受限浏览器仅显示“高歌体育 → 高歌 FC → 球员信息”，直接 `/system/user` 为 404；`GET /system/users` 和 10 个写入 smoke 均应用码 403，球员 GET 应用码 0。浏览器 0 errors，仅既有 Vue Router `next()` deprecation warning。
- Review 修复提交：`e39e1c9`、`9d57d77`、`507827e`、`84c98eb`、`1afb576`、`cce7884`、`c97d8e7`。截图和完整命令证据位于 Task 7 报告及 `evidence/round2-*.png`。

## Task 7 Review Round 2 复验结果（2026-08-26）

- `d80851f` 将 active workspace 的菜单 create/update payload 构建提取为纯函数；update 对清空图标发送显式 `icon: ''`，create 对空图标保持省略。legacy mapper 的 update 同样发送显式空值，不再存在 `trim() || undefined` 回归路径。
- 新增可执行 `system-menu-payload.test.ts`，直接构造已有菜单表单和 `expectedUpdatedAt`，断言最终 API update payload 的 `icon` 严格等于空字符串且不为 `undefined`；同时覆盖 legacy update 与 create 省略语义。回退 active update 一次后该测试按预期红，再恢复修复后 2/2 绿。
- Admin 导航/RBAC/工作区/payload 聚焦测试 27/27，Admin typecheck/build、共享类型 typecheck、任务路径 ESLint/Prettier 和 diff check 全部通过。尝试运行所有 `apps/admin/tests/*.test.ts` 时，除任务外既有 `football-match-round-latest.test.ts` 因 Node 24 无法解析 extensionless `model/latest` 导入而失败，其余 46 tests（包含本次 2 tests）通过；本任务未扩展范围修改该既有 loader 问题。
- 本轮只修改 Admin 纯映射与调用路径，没有修改 API、shared contract 或数据库，因此无需重启隔离 API/Admin 或触碰任何本地数据库。
