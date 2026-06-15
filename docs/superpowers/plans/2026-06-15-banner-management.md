# Banner 管理功能 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `apps/api`、`apps/admin`、`apps/miniapp` 三端落地完整可用的 Banner 管理与展示能力，并把后端模块归位到 `content` 目录。

**Architecture:** 以现有 `Banner` 表为基础做一次小幅重构，新增明确跳转语义 `jumpType/jumpUrl`，并将旧的顶层 `banner` 模块迁移为 `content/banner` 模块。后台沿用标准 CRUD 结构接入上传与图片链接双录入，小程序首页只做轻量轮播展示与三种点击行为，不扩写成通用内容系统。

**Tech Stack:** NestJS + Prisma + Jest、Vue 3 + Element Plus、uni-app + Pinia、workspace shared types

---

## File Structure

### API

- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/20260615153000_refactor_banner_for_content/migration.sql`
- Modify: `apps/api/src/app.module.ts`
- Modify: `apps/api/src/modules/content/content.module.ts`
- Create: `apps/api/src/modules/content/banner/banner.module.ts`
- Create: `apps/api/src/modules/content/banner/banner.controller.ts`
- Create: `apps/api/src/modules/content/banner/banner.service.ts`
- Create: `apps/api/src/modules/content/banner/banner.service.spec.ts`
- Create: `apps/api/src/modules/content/banner/dto/create-banner.dto.ts`
- Create: `apps/api/src/modules/content/banner/dto/update-banner.dto.ts`
- Create: `apps/api/src/modules/content/banner/dto/banner-list.dto.ts`
- Delete or stop importing: `apps/api/src/modules/banner/banner.module.ts`
- Delete or stop importing: `apps/api/src/modules/banner/banner.controller.ts`
- Delete or stop importing: `apps/api/src/modules/banner/banner.service.ts`
- Delete or stop importing: `apps/api/src/modules/banner/dto/create-banner.dto.ts`
- Modify: `apps/api/src/modules/auth/permissions.ts`
- Modify: `apps/api/src/modules/system/rbac/builtins.ts`
- Modify: `apps/api/src/modules/miniapp/miniapp-public.controller.ts`
- Modify: `apps/api/src/common/storage/upload-path.ts`

### Shared types

- Modify: `packages/shared/types/src/banner.ts`
- Modify: `packages/shared/types/src/index.ts`

### Admin

- Create: `apps/admin/src/api/content/banner/index.ts`
- Modify: `apps/admin/src/router/modules/content/index.ts`
- Create: `apps/admin/src/views/content/banner/auth.ts`
- Create: `apps/admin/src/views/content/banner/index.vue`
- Create: `apps/admin/src/views/content/banner/model/types.ts`
- Create: `apps/admin/src/views/content/banner/model/mapper.ts`
- Create: `apps/admin/src/views/content/banner/model/defaults.ts`
- Create: `apps/admin/src/views/content/banner/schemas/search.ts`
- Create: `apps/admin/src/views/content/banner/schemas/table.ts`
- Create: `apps/admin/src/views/content/banner/schemas/form.ts`
- Create: `apps/admin/src/views/content/banner/components/BannerForm.vue`
- Create: `apps/admin/src/views/content/banner/components/BannerFormDialog.vue`

### Miniapp

- Create: `apps/miniapp/src/api/banner/index.ts`
- Modify: `apps/miniapp/src/api/index.ts`
- Modify: `apps/miniapp/src/pages/home/index.vue`
- Reuse: `apps/miniapp/src/router/index.ts`
- Reuse: `apps/miniapp/src/pages/common/webview/index.vue`

## Task 1: Refactor Banner Persistence and Shared Contracts

**Files:**

- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/20260615153000_refactor_banner_for_content/migration.sql`
- Modify: `packages/shared/types/src/banner.ts`
- Modify: `packages/shared/types/src/index.ts`
- Test: `pnpm --filter @gaoge/app-api typecheck`

- [ ] **Step 1: Write the target Prisma and shared type shape in the plan branch**

```prisma
model Banner {
  id       Int    @id @default(autoincrement())
  title    String
  imageUrl String
  jumpType String @default("none")
  jumpUrl  String?
  sort     Int    @default(0)
  status   String @default("active")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([status, sort])
}
```

```ts
export type BannerStatus = 'active' | 'inactive'
export type BannerJumpType = 'none' | 'webview' | 'miniapp'

export interface Banner {
  id: number
  title: string
  imageUrl: string
  jumpType: BannerJumpType
  jumpUrl: string | null
  sort: number
  status: BannerStatus
  createdAt: DateTimeString
  updatedAt: DateTimeString
}

export interface BannerPayload {
  title: string
  imageUrl: string
  jumpType: BannerJumpType
  jumpUrl?: string
  sort?: number
  status?: BannerStatus
}
```

- [ ] **Step 2: Add the migration SQL that preserves existing data**

```sql
ALTER TABLE "Banner"
ADD COLUMN "jumpType" TEXT NOT NULL DEFAULT 'none',
ADD COLUMN "jumpUrl" TEXT;

UPDATE "Banner"
SET
  "jumpUrl" = "linkUrl",
  "jumpType" = CASE
    WHEN "linkUrl" IS NULL OR btrim("linkUrl") = '' THEN 'none'
    WHEN "linkUrl" ~* '^https?://' THEN 'webview'
    ELSE 'miniapp'
  END;

ALTER TABLE "Banner" DROP COLUMN "linkUrl";
```

- [ ] **Step 3: Update Prisma schema and shared type exports**

```ts
export type * from './banner.js'
```

Run:

```bash
pnpm --filter @gaoge/app-api exec prisma generate
```

Expected: Prisma Client regenerates without schema errors.

- [ ] **Step 4: Run API typecheck to validate the new contract compiles**

Run:

```bash
pnpm --filter @gaoge/app-api typecheck
```

Expected: PASS after replacing all `linkUrl` references in touched files or after temporarily isolating old banner module imports in later tasks.

- [ ] **Step 5: Commit the contract and migration**

```bash
git add apps/api/prisma/schema.prisma apps/api/prisma/migrations packages/shared/types/src/banner.ts packages/shared/types/src/index.ts
git commit -m "refactor: align banner data model with content routing"
```

## Task 2: Move Banner API into the Content Domain

**Files:**

- Create: `apps/api/src/modules/content/banner/banner.module.ts`
- Create: `apps/api/src/modules/content/banner/banner.controller.ts`
- Create: `apps/api/src/modules/content/banner/banner.service.ts`
- Create: `apps/api/src/modules/content/banner/dto/create-banner.dto.ts`
- Create: `apps/api/src/modules/content/banner/dto/update-banner.dto.ts`
- Create: `apps/api/src/modules/content/banner/dto/banner-list.dto.ts`
- Create: `apps/api/src/modules/content/banner/banner.service.spec.ts`
- Modify: `apps/api/src/modules/content/content.module.ts`
- Modify: `apps/api/src/app.module.ts`
- Delete or stop importing: `apps/api/src/modules/banner/*`
- Test: `apps/api/src/modules/content/banner/banner.service.spec.ts`

- [ ] **Step 1: Write the failing banner service tests under the new content path**

```ts
it('returns only active banners for public miniapp usage sorted by sort desc then id desc', async () => {
  const { prisma, service } = createService()

  await service.findPublished()

  expect(prisma.banner.findMany).toHaveBeenCalledWith({
    where: { status: 'active' },
    orderBy: [{ sort: 'desc' }, { id: 'desc' }],
  })
})

it('filters admin list by keyword status and jumpType', async () => {
  const { prisma, service } = createService()

  await service.findAll({
    keyword: '训练营',
    status: 'active',
    jumpType: 'miniapp',
  })

  expect(prisma.banner.findMany).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        status: 'active',
        jumpType: 'miniapp',
        title: {
          contains: '训练营',
          mode: 'insensitive',
        },
      },
    }),
  )
})
```

- [ ] **Step 2: Run the new test file and verify it fails because the module does not exist yet**

Run:

```bash
pnpm --filter @gaoge/app-api test -- --runInBand src/modules/content/banner/banner.service.spec.ts
```

Expected: FAIL with module-not-found or missing export errors for `content/banner`.

- [ ] **Step 3: Implement the new DTOs, controller, service, and content module wiring**

```ts
@Controller('content/banners')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BannerController {
  @Get()
  findPublic() {
    return this.bannerService.findPublished()
  }

  @Get('admin')
  @RequirePermissions('content.banner.view')
  findAll(@Query() query: BannerListDto) {
    return this.bannerService.findAll(query)
  }
}
```

```ts
async findPublished(): Promise<Banner[]> {
  const list = await this.prisma.banner.findMany({
    where: { status: 'active' },
    orderBy: [{ sort: 'desc' }, { id: 'desc' }],
  })

  return list.map(serializeBanner)
}
```

```ts
function buildAdminWhere(params: BannerListParams = {}): Prisma.BannerWhereInput {
  const where: Prisma.BannerWhereInput = {}

  if (params.status) {
    where.status = params.status
  }
  if (params.jumpType) {
    where.jumpType = params.jumpType
  }
  if (params.keyword?.trim()) {
    where.title = {
      contains: params.keyword.trim(),
      mode: 'insensitive',
    }
  }

  return where
}
```

- [ ] **Step 4: Run the banner service tests again and verify they pass**

Run:

```bash
pnpm --filter @gaoge/app-api test -- --runInBand src/modules/content/banner/banner.service.spec.ts
```

Expected: PASS with the new `content/banner` service.

- [ ] **Step 5: Commit the content-domain banner module**

```bash
git add apps/api/src/app.module.ts apps/api/src/modules/content apps/api/src/modules/banner
git commit -m "feat(api): move banner module under content domain"
```

## Task 3: Add Validation, Upload, and RBAC for Banner Management

**Files:**

- Modify: `apps/api/src/modules/content/banner/banner.controller.ts`
- Modify: `apps/api/src/modules/content/banner/banner.service.ts`
- Modify: `apps/api/src/modules/content/banner/banner.service.spec.ts`
- Modify: `apps/api/src/common/storage/upload-path.ts`
- Modify: `apps/api/src/modules/auth/permissions.ts`
- Modify: `apps/api/src/modules/system/rbac/builtins.ts`
- Test: `apps/api/src/modules/content/banner/banner.service.spec.ts`

- [ ] **Step 1: Add failing tests for jump validation and public upload path usage**

```ts
it('stores null jumpUrl when jumpType is none', async () => {
  const { prisma, service } = createService()

  prisma.banner.create.mockResolvedValue({})

  await service.create({
    title: '纯展示',
    imageUrl: 'https://cdn.example.com/banner.png',
    jumpType: 'none',
    sort: 10,
    status: 'active',
  } as any)

  expect(prisma.banner.create).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({
        jumpType: 'none',
        jumpUrl: null,
      }),
    }),
  )
})
```

```ts
it('rejects invalid miniapp paths', async () => {
  await expect(
    validateBannerJump({
      jumpType: 'miniapp',
      jumpUrl: 'pages/home/index',
    }),
  ).rejects.toThrow('小程序页面路径必须以 /pages/ 开头')
})
```

- [ ] **Step 2: Run the targeted API tests and verify the new assertions fail**

Run:

```bash
pnpm --filter @gaoge/app-api test -- --runInBand src/modules/content/banner/banner.service.spec.ts
```

Expected: FAIL on missing `validateBannerJump`, missing upload path constants, or incorrect `jumpUrl` normalization.

- [ ] **Step 3: Implement conditional jump validation, upload endpoint, and banner RBAC**

```ts
const bannerJumpTypeValues = ['none', 'webview', 'miniapp'] as const

export class CreateBannerDto {
  @IsIn(bannerJumpTypeValues)
  jumpType: BannerJumpType

  @ValidateIf((dto) => dto.jumpType !== 'none')
  @IsString()
  jumpUrl?: string
}
```

```ts
export const contentBannerPublicPrefix = `${uploadPublicPrefix}/content-banner`

export function resolveContentBannerUploadDir(configuredRoot = process.env.API_UPLOAD_ROOT) {
  return join(resolveUploadRoot(configuredRoot), 'content-banner')
}
```

```ts
@Post('upload-image')
@RequirePermissions('content.banner.create')
@UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
async uploadImage(@Req() request: Request, @UploadedFile() file?: BannerUploadedFile) {
  return {
    imageUrl: await saveBannerImage(request, file),
  }
}
```

```ts
'content.banner.view',
'content.banner.create',
'content.banner.update',
'content.banner.delete',
```

- [ ] **Step 4: Re-run the API banner tests and a focused typecheck**

Run:

```bash
pnpm --filter @gaoge/app-api test -- --runInBand src/modules/content/banner/banner.service.spec.ts
pnpm --filter @gaoge/app-api typecheck
```

Expected: PASS for tests and typecheck with no missing permission or upload helper references.

- [ ] **Step 5: Commit validation, upload, and RBAC changes**

```bash
git add apps/api/src/common/storage/upload-path.ts apps/api/src/modules/auth/permissions.ts apps/api/src/modules/system/rbac/builtins.ts apps/api/src/modules/content/banner
git commit -m "feat(api): add banner upload and permissions"
```

## Task 4: Build the Admin Banner CRUD Surface

**Files:**

- Create: `apps/admin/src/api/content/banner/index.ts`
- Modify: `apps/admin/src/router/modules/content/index.ts`
- Create: `apps/admin/src/views/content/banner/auth.ts`
- Create: `apps/admin/src/views/content/banner/index.vue`
- Create: `apps/admin/src/views/content/banner/model/types.ts`
- Create: `apps/admin/src/views/content/banner/model/mapper.ts`
- Create: `apps/admin/src/views/content/banner/model/defaults.ts`
- Create: `apps/admin/src/views/content/banner/schemas/search.ts`
- Create: `apps/admin/src/views/content/banner/schemas/table.ts`
- Create: `apps/admin/src/views/content/banner/schemas/form.ts`
- Test: `pnpm --filter @gaoge/app-admin typecheck`

- [ ] **Step 1: Scaffold the failing admin route and API entry**

```ts
export default {
  list: (params?: BannerListParams) => api.get<Banner[]>('/content/banners/admin', { params }),
  create: (data: BannerPayload) => api.post<Banner>('/content/banners', data),
  update: (id: number, data: UpdateBannerPayload) =>
    api.patch<Banner>(`/content/banners/${id}`, data),
  remove: (id: number) => api.delete<Banner>(`/content/banners/${id}`),
}
```

```ts
{
  path: 'banner',
  name: 'contentBanner',
  component: () => import('@/views/content/banner/index.vue'),
  meta: {
    title: 'Banner 管理',
    auth: ['content.banner.view'],
  },
}
```

- [ ] **Step 2: Run admin typecheck and verify it fails because the page scaffolding is incomplete**

Run:

```bash
pnpm --filter @gaoge/app-admin typecheck
```

Expected: FAIL on missing `@/views/content/banner/index.vue` or missing model/schema imports.

- [ ] **Step 3: Implement the CRUD list page following the existing content/message-board-post pattern**

```ts
const {
  search,
  tableData,
  total,
  loading,
  page,
  pageSize,
  fetchList: fetchBanners,
  handleSearch,
  handlePaginationChange,
} = useListPage<BannerSearch, Banner, ReturnType<typeof buildBannerListParams>>({
  defaultSearch: BANNER_DEFAULT_SEARCH,
  buildParams: buildBannerListParams,
  request: bannerApi.list,
})
```

```vue
<EsTable
  v-model:page="page"
  v-model:page-size="pageSize"
  :columns="BANNER_TABLE_COLUMNS"
  :data="tableData"
  :total="total"
  :loading="loading"
  table-height="100%"
  @action-click="handleTableAction"
  @pagination-change="handlePaginationChange"
>
  <template #imageUrl="{ row }">
    <ElImage :src="row.imageUrl" fit="cover" class="h-52 w-120 rounded-8" />
  </template>
</EsTable>
```

- [ ] **Step 4: Run admin typecheck again and verify the list page compiles**

Run:

```bash
pnpm --filter @gaoge/app-admin typecheck
```

Expected: PASS for route, API entry, and list page compilation.

- [ ] **Step 5: Commit the admin CRUD shell**

```bash
git add apps/admin/src/api/content/banner apps/admin/src/router/modules/content/index.ts apps/admin/src/views/content/banner
git commit -m "feat(admin): add banner management page shell"
```

## Task 5: Add Admin Banner Form, Upload, and Conditional Validation

**Files:**

- Modify: `apps/admin/src/views/content/banner/components/BannerForm.vue`
- Modify: `apps/admin/src/views/content/banner/components/BannerFormDialog.vue`
- Modify: `apps/admin/src/views/content/banner/schemas/form.ts`
- Modify: `apps/admin/src/views/content/banner/model/mapper.ts`
- Modify: `apps/admin/src/api/content/banner/index.ts`
- Test: `pnpm --filter @gaoge/app-admin typecheck`

- [ ] **Step 1: Add the failing form wiring for upload and jump-type-specific fields**

```ts
uploadImage: (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post<{ imageUrl: string }>('/content/banners/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
```

```ts
if (values.jumpType === 'webview' && !/^https?:\/\//.test(values.jumpUrl || '')) {
  errors.jumpUrl = '请填写 http:// 或 https:// 开头的链接'
}
if (values.jumpType === 'miniapp' && !/^\/pages\//.test(values.jumpUrl || '')) {
  errors.jumpUrl = '请填写以 /pages/ 开头的小程序页面路径'
}
```

- [ ] **Step 2: Run admin typecheck and verify it fails on missing upload handler or form props**

Run:

```bash
pnpm --filter @gaoge/app-admin typecheck
```

Expected: FAIL on missing `uploadImage`, missing form emits, or unresolved schema props.

- [ ] **Step 3: Implement the form dialog with `ImageUpload` plus manual URL entry**

```vue
<ImageUpload
  :action="uploadAction"
  :headers="uploadHeaders"
  :http-request="uploadRequest"
  :width="240"
  :height="120"
  @on-success="handleUploadSuccess"
/>

<ElInput v-model="formModel.imageUrl" placeholder="可直接填写图片链接" />
<ElImage
  v-if="formModel.imageUrl"
  :src="formModel.imageUrl"
  fit="cover"
  class="h-120 w-240 rounded-8 mt-12"
/>
```

```ts
function handleUploadSuccess(payload: { imageUrl: string }) {
  formModel.imageUrl = payload.imageUrl
}
```

```ts
watch(
  () => formModel.jumpType,
  (value) => {
    if (value === 'none') {
      formModel.jumpUrl = ''
    }
  },
)
```

- [ ] **Step 4: Re-run admin typecheck and a focused lint check on touched banner files**

Run:

```bash
pnpm --filter @gaoge/app-admin typecheck
pnpm exec eslint apps/admin/src/views/content/banner apps/admin/src/api/content/banner --fix
```

Expected: PASS for the banner form flow with no Vue or TS errors.

- [ ] **Step 5: Commit the admin form and upload integration**

```bash
git add apps/admin/src/api/content/banner apps/admin/src/views/content/banner
git commit -m "feat(admin): support banner upload and jump configuration"
```

## Task 6: Connect Miniapp Home Banner Fetching and Navigation

**Files:**

- Create: `apps/miniapp/src/api/banner/index.ts`
- Modify: `apps/miniapp/src/api/index.ts`
- Modify: `apps/miniapp/src/pages/home/index.vue`
- Reuse: `apps/miniapp/src/router/index.ts`
- Test: `pnpm --filter @gaoge/app-miniapp typecheck`

- [ ] **Step 1: Add the failing miniapp banner request and navigation helper signatures**

```ts
export const requestBanners = () =>
  api.get<Banner[]>('/content/banners', undefined, {
    skipAuth: true,
    toast: false,
  })
```

```ts
export function navigateByBanner(banner: Banner) {
  if (banner.jumpType === 'none') {
    return
  }
}
```

- [ ] **Step 2: Run miniapp typecheck and verify it fails because the new home flow is incomplete**

Run:

```bash
pnpm --filter @gaoge/app-miniapp typecheck
```

Expected: FAIL on missing `Banner` imports, unresolved request export, or incomplete home page refs.

- [ ] **Step 3: Implement the home page banner carousel and click behavior**

```ts
import { isPathExists, isTabBarPath } from '@/router'

const banners = ref<Banner[]>([])

async function loadBanners() {
  try {
    banners.value = await requestBanners()
  } catch {
    banners.value = []
  }
}

function handleBannerTap(item: Banner) {
  if (item.jumpType === 'none') {
    return
  }

  if (item.jumpType === 'webview' && item.jumpUrl) {
    uni.navigateTo({
      url: `/pages/common/webview/index?url=${encodeURIComponent(item.jumpUrl)}&title=${encodeURIComponent(item.title)}`,
    })
    return
  }

  if (item.jumpType === 'miniapp' && item.jumpUrl && isPathExists(item.jumpUrl)) {
    if (isTabBarPath(item.jumpUrl)) {
      uni.switchTab({ url: item.jumpUrl })
    } else {
      uni.navigateTo({ url: item.jumpUrl })
    }
    return
  }

  uni.showToast({ title: '跳转配置无效', icon: 'none' })
}
```

```vue
<swiper v-if="banners.length" class="home-banner-swiper" circular autoplay indicator-dots>
  <swiper-item v-for="item in banners" :key="item.id">
    <view class="home-banner-item" @tap="handleBannerTap(item)">
      <image class="home-banner-image" :src="item.imageUrl" mode="aspectFill" />
    </view>
  </swiper-item>
</swiper>
```

- [ ] **Step 4: Re-run miniapp typecheck**

Run:

```bash
pnpm --filter @gaoge/app-miniapp typecheck
```

Expected: PASS with the home page compiling and no route helper type errors.

- [ ] **Step 5: Commit the miniapp banner integration**

```bash
git add apps/miniapp/src/api apps/miniapp/src/pages/home/index.vue
git commit -m "feat(miniapp): display home banners with configured navigation"
```

## Task 7: Full Verification and Cleanup

**Files:**

- Modify: touched API/Admin/Miniapp files that fail verification in this task
- Test: root lint, root typecheck, focused API Jest

- [ ] **Step 1: Run focused API banner tests after all cross-module wiring is complete**

Run:

```bash
pnpm --filter @gaoge/app-api test -- --runInBand src/modules/content/banner/banner.service.spec.ts
```

Expected: PASS with public list, admin filters, and normalization behaviors covered.

- [ ] **Step 2: Run per-app typechecks**

Run:

```bash
pnpm --filter @gaoge/app-api typecheck
pnpm --filter @gaoge/app-admin typecheck
pnpm --filter @gaoge/app-miniapp typecheck
```

Expected: PASS for all three apps.

- [ ] **Step 3: Run repository-wide lint and typecheck**

Run:

```bash
pnpm lint
pnpm typecheck
```

Expected: PASS, or if unrelated pre-existing failures appear, capture them clearly before any final status claim.

- [ ] **Step 4: Remove the old top-level banner module imports and verify there are no stale references**

Run:

```bash
rg -n "modules/banner|linkUrl|content\\.banner|/content/banners|jumpType|jumpUrl" apps packages --glob '!**/node_modules/**'
```

Expected: old `apps/api/src/modules/banner` references are gone from runtime wiring, and new `jumpType/jumpUrl` references are present in the expected API/Admin/Miniapp paths.

- [ ] **Step 5: Commit verification fixes and final implementation**

```bash
git add apps/api apps/admin apps/miniapp packages/shared/types
git commit -m "feat: complete banner management across api admin and miniapp"
```
