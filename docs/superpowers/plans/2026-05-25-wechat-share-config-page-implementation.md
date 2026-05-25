# Wechat Share Config Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a configurable WeChat share settings flow across `apps/api`, `apps/admin`, and `apps/web` so administrators can manage公众号凭证与三类页面分享文案 without further code changes.

**Architecture:** Extend the existing `apps/api/src/modules/wechat-share` module instead of creating a parallel settings subsystem. Persist one global config record in Prisma, expose an authenticated admin endpoint and a public per-path share-config endpoint, then switch the current static `apps/web` share source to runtime API data while adding a dedicated admin settings page guarded by new RBAC permissions.

**Tech Stack:** Prisma 5, NestJS 11, Jest, Vue 3, Element Plus, Axios, Vitest, `@gaoge/shared-types`

---

## File Structure

### Shared types

- Create: `packages/shared/types/src/wechat-share.ts`
- Modify: `packages/shared/types/src/index.ts`

### API

- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/20260525120000_add_wechat_share_config/migration.sql`
- Modify: `apps/api/src/modules/wechat-share/wechat-share.module.ts`
- Modify: `apps/api/src/modules/wechat-share/wechat-share.controller.ts`
- Modify: `apps/api/src/modules/wechat-share/wechat-share.service.ts`
- Modify: `apps/api/src/modules/wechat-share/wechat-share.controller.spec.ts`
- Modify: `apps/api/src/modules/wechat-share/wechat-share.service.spec.ts`
- Create: `apps/api/src/modules/wechat-share/dto/update-wechat-share-admin-config.dto.ts`
- Create: `apps/api/src/modules/wechat-share/dto/get-wechat-share-public-config.dto.ts`
- Modify: `apps/api/src/modules/system/rbac/builtins.ts`
- Modify: `apps/api/src/modules/system/rbac/rbac-sync.service.spec.ts`

### Admin

- Create: `apps/admin/src/api/system/wechat-share/index.ts`
- Create: `apps/admin/src/views/system/wechat-share/index.vue`
- Create: `apps/admin/src/views/system/wechat-share/auth.ts`
- Create: `apps/admin/src/router/modules/system/wechat-share.ts`
- Modify: `apps/admin/src/router/modules/system/index.ts`

### Web

- Modify: `apps/web/src/utils/wechatShare.js`
- Modify: `apps/web/src/utils/wechatShare.test.js`
- Delete-or-stop-using: `apps/web/src/content/wechat-share.js`
- Modify: `apps/web/src/App.test.js`

### Verification

- Test: `pnpm --filter @gaoge/app-api test -- src/modules/wechat-share/wechat-share.service.spec.ts src/modules/wechat-share/wechat-share.controller.spec.ts src/modules/system/rbac/rbac-sync.service.spec.ts`
- Test: `pnpm --filter @gaoge/app-web test -- src/utils/wechatShare.test.js src/App.test.js`
- Typecheck: `pnpm --filter @gaoge/shared-types typecheck`
- Typecheck: `pnpm --filter @gaoge/app-api typecheck`
- Typecheck: `pnpm --filter @gaoge/app-admin typecheck`
- Typecheck: `pnpm --filter @gaoge/app-web typecheck`

## Task 1: Persist and expose WeChat share config in `apps/api`

**Files:**

- Create: `packages/shared/types/src/wechat-share.ts`
- Modify: `packages/shared/types/src/index.ts`
- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/20260525120000_add_wechat_share_config/migration.sql`
- Create: `apps/api/src/modules/wechat-share/dto/update-wechat-share-admin-config.dto.ts`
- Create: `apps/api/src/modules/wechat-share/dto/get-wechat-share-public-config.dto.ts`
- Modify: `apps/api/src/modules/wechat-share/wechat-share.controller.ts`
- Modify: `apps/api/src/modules/wechat-share/wechat-share.service.ts`
- Modify: `apps/api/src/modules/wechat-share/wechat-share.module.ts`
- Modify: `apps/api/src/modules/wechat-share/wechat-share.controller.spec.ts`
- Modify: `apps/api/src/modules/wechat-share/wechat-share.service.spec.ts`

- [ ] **Step 1: Write the failing API tests for admin config read/write, public path resolution, and DB-backed signature config**

```ts
it('returns admin config without exposing appSecret', async () => {
  await expect(service.getAdminConfig()).resolves.toMatchObject({
    appId: 'wx-appid',
    hasAppSecret: true,
    defaultImageUrl: 'https://cdn.gaoge.cc/default.png',
  })
})

it('keeps the existing appSecret when update payload leaves it blank', async () => {
  await service.updateAdminConfig({ appId: 'wx-appid', appSecret: '' })
  expect(prisma.wechatShareConfig.update).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.not.objectContaining({ appSecret: '' }),
    }),
  )
})

it('maps /teams/football/assets to asset config and falls back to default image', async () => {
  await expect(service.getPublicConfig('/teams/football/assets')).resolves.toEqual({
    title: '资产标题',
    desc: '资产简介',
    imgUrl: 'https://cdn.gaoge.cc/default.png',
  })
})

it('uses database appId and appSecret when generating a jssdk signature', async () => {
  await expect(service.getJssdkSignature('https://gaoge.cc/')).resolves.toMatchObject({
    appId: 'wx-db-appid',
  })
})
```

- [ ] **Step 2: Run the focused API test command and confirm the new cases fail for the expected missing behavior**

```bash
pnpm --filter @gaoge/app-api test -- src/modules/wechat-share/wechat-share.service.spec.ts src/modules/wechat-share/wechat-share.controller.spec.ts
```

- [ ] **Step 3: Add shared payload/response types, Prisma model, DTO validation, and service/controller implementation**

```ts
export interface WechatShareAdminConfig {
  appId: string
  hasAppSecret: boolean
  defaultImageUrl: string
  homeTitle: string
  homeDesc: string
  homeImageUrl: string
  teamsTitle: string
  teamsDesc: string
  teamsImageUrl: string
  assetsTitle: string
  assetsDesc: string
  assetsImageUrl: string
}

@Get('admin-config')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('system.wechat-share.view')
getAdminConfig() {
  return this.wechatShareService.getAdminConfig()
}

@Put('admin-config')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('system.wechat-share.update')
updateAdminConfig(@Body() dto: UpdateWechatShareAdminConfigDto) {
  return this.wechatShareService.updateAdminConfig(dto)
}

@Get('public-config')
getPublicConfig(@Query() query: GetWechatSharePublicConfigDto) {
  return this.wechatShareService.getPublicConfig(query.path)
}
```

- [ ] **Step 4: Run the focused API tests again and keep iterating until they pass**

```bash
pnpm --filter @gaoge/app-api test -- src/modules/wechat-share/wechat-share.service.spec.ts src/modules/wechat-share/wechat-share.controller.spec.ts
```

- [ ] **Step 5: Add RBAC built-ins for the new admin page and verify sync behavior**

```ts
'system.wechat-share.view',
'system.wechat-share.update',
```

```bash
pnpm --filter @gaoge/app-api test -- src/modules/system/rbac/rbac-sync.service.spec.ts
```

## Task 2: Add the dedicated settings page in `apps/admin`

**Files:**

- Create: `apps/admin/src/api/system/wechat-share/index.ts`
- Create: `apps/admin/src/views/system/wechat-share/index.vue`
- Create: `apps/admin/src/views/system/wechat-share/auth.ts`
- Create: `apps/admin/src/router/modules/system/wechat-share.ts`
- Modify: `apps/admin/src/router/modules/system/index.ts`

- [ ] **Step 1: Write or stage the admin-side contract first as types and field schema constants**

```ts
export const SYSTEM_WECHAT_SHARE_PERMISSIONS = {
  view: 'system.wechat-share.view',
  update: 'system.wechat-share.update',
} as const
```

```ts
export default {
  detail: () => api.get<WechatShareAdminConfig>('/wechat/share/admin-config'),
  update: (data: UpdateWechatShareAdminConfigPayload) =>
    api.put<WechatShareAdminConfig>('/wechat/share/admin-config', data),
}
```

- [ ] **Step 2: Implement the page as one form with two cards and `https://` URL validation**

```vue
<ElCard header="公众号配置">
  <ElFormItem label="AppID" prop="appId" />
  <ElFormItem label="AppSecret" prop="appSecret" />
  <ElFormItem label="默认分享图 URL" prop="defaultImageUrl" />
</ElCard>

<ElCard header="页面分享配置">
  <!-- 首页 / 球队页 / 资产页 三组字段 -->
</ElCard>
```

- [ ] **Step 3: Register the route under system management with permission metadata**

```ts
{
  path: 'wechat-share',
  name: 'systemWechatShare',
  component: () => import('@/views/system/wechat-share/index.vue'),
  meta: {
    title: '微信分享配置',
    auth: [SYSTEM_WECHAT_SHARE_PERMISSIONS.view],
  },
}
```

- [ ] **Step 4: Verify the admin app still typechecks with the new route and page**

```bash
pnpm --filter @gaoge/app-admin typecheck
```

## Task 3: Replace static share content with runtime config in `apps/web`

**Files:**

- Modify: `apps/web/src/utils/wechatShare.js`
- Modify: `apps/web/src/utils/wechatShare.test.js`
- Modify: `apps/web/src/App.test.js`

- [ ] **Step 1: Extend the web tests to fail on the current static resolver**

```ts
it('requests public share config before requesting jssdk signature', async () => {
  api.getJson
    .mockResolvedValueOnce({
      title: '球队标题',
      desc: '球队简介',
      imgUrl: 'https://cdn.gaoge.cc/team.png',
    })
    .mockResolvedValueOnce({
      appId: 'wx-official',
      timestamp: 1716530000,
      nonceStr: 'nonce-value',
      signature: 'signature-value',
    })

  await syncWechatShare({ path: '/teams/football', fullPath: '/teams/football' })

  expect(api.getJson).toHaveBeenNthCalledWith(1, '/wechat/share/public-config', {
    path: '/teams/football',
  })
})
```

- [ ] **Step 2: Run the focused web tests and confirm they fail because the old static config is still in use**

```bash
pnpm --filter @gaoge/app-web test -- src/utils/wechatShare.test.js src/App.test.js
```

- [ ] **Step 3: Switch `syncWechatShare()` to runtime public config fetching with graceful failure handling**

```ts
const shareConfig = await getJson('/wechat/share/public-config', {
  path: route.path,
})

const signature = await getJson('/wechat/share/jssdk-signature', {
  url: link,
})
```

- [ ] **Step 4: Re-run the web tests and confirm route-change behavior still passes**

```bash
pnpm --filter @gaoge/app-web test -- src/utils/wechatShare.test.js src/App.test.js
```

## Final Verification

- [ ] Run API targeted tests

```bash
pnpm --filter @gaoge/app-api test -- src/modules/wechat-share/wechat-share.service.spec.ts src/modules/wechat-share/wechat-share.controller.spec.ts src/modules/system/rbac/rbac-sync.service.spec.ts
```

- [ ] Run web targeted tests

```bash
pnpm --filter @gaoge/app-web test -- src/utils/wechatShare.test.js src/App.test.js
```

- [ ] Run package/app typechecks

```bash
pnpm --filter @gaoge/shared-types typecheck
pnpm --filter @gaoge/app-api typecheck
pnpm --filter @gaoge/app-admin typecheck
pnpm --filter @gaoge/app-web typecheck
```
