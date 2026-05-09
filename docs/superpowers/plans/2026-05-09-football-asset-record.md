# Football Asset Record Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dedicated `资产信息` module under `高歌FC`, including backend CRUD + summary endpoints and an admin CRUD page aligned with the existing player page pattern.

**Architecture:** Introduce a new `FootballAssetRecord` Prisma model and a dedicated `football/asset-record` module instead of extending the old `fund` module. Keep season and match as optional text labels, expose a small summary endpoint for totals, and implement the admin page by mirroring the current `player/team/match_round` page structure with one additional summary-card area.

**Tech Stack:** Prisma, NestJS, Jest (focused service coverage only), workspace shared types, Vue 3, Element Plus, existing `EsSearch` / `EsTable` / `useListPage` / `useCrudDialog`

---

### Task 1: Shared contracts, Prisma model, and migration

**Files:**

- Create: `packages/shared/types/src/asset-record.ts`
- Modify: `packages/shared/types/src/index.ts`
- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/<timestamp>_add_football_asset_record/migration.sql`
- Test: `pnpm --filter @gaoge/app-api prisma generate`

- [ ] **Step 1: Add the shared asset-record contracts**

```ts
// packages/shared/types/src/asset-record.ts
export type AssetRecordDirection = 'income' | 'expense'
export type AssetRecordType =
  | 'match_fee'
  | 'extra_income'
  | 'equipment'
  | 'activity'
  | 'other_expense'
export type AssetRecordStatus = 'confirmed' | 'cancelled'

export interface AssetRecord {
  id: number
  direction: AssetRecordDirection
  recordType: AssetRecordType
  amount: number
  seasonLabel: string | null
  matchLabel: string | null
  isWaived: boolean
  title: string
  description: string | null
  recordDate: string
  status: AssetRecordStatus
  createdAt: string
  updatedAt: string
}

export interface AssetRecordListParams {
  page?: number
  pageSize?: number
  keyword?: string
  direction?: AssetRecordDirection
  recordType?: AssetRecordType
  seasonLabel?: string
  status?: AssetRecordStatus
  startDate?: string
  endDate?: string
}

export interface AssetRecordListResponse {
  list: AssetRecord[]
  total: number
}

export interface AssetRecordPayload {
  direction: AssetRecordDirection
  recordType: AssetRecordType
  amount: number
  seasonLabel?: string
  matchLabel?: string
  isWaived?: boolean
  title: string
  description?: string
  recordDate: string
  status: AssetRecordStatus
}

export interface AssetRecordSummary {
  totalIncome: number
  totalExpense: number
  balance: number
  waivedMatchCount: number
}
```

- [ ] **Step 2: Register the shared types export**

Run edit in `packages/shared/types/src/index.ts` to export `asset-record.ts`.

- [ ] **Step 3: Add the Prisma model**

```prisma
model FootballAssetRecord {
  id          Int      @id @default(autoincrement())
  direction   String
  recordType  String
  amount      Int
  seasonLabel String?
  matchLabel  String?
  isWaived    Boolean  @default(false)
  title       String
  description String?
  recordDate  DateTime
  status      String   @default("confirmed")
  creatorId   Int?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([direction])
  @@index([recordType])
  @@index([recordDate])
  @@index([status])
  @@index([seasonLabel])
  @@index([matchLabel])
}
```

- [ ] **Step 4: Create the SQL migration**

Run: `pnpm --filter @gaoge/app-api exec prisma migrate dev --create-only --name add_football_asset_record`
Expected: new migration directory created with SQL for the new table and indexes

- [ ] **Step 5: Regenerate Prisma client**

Run: `pnpm --filter @gaoge/app-api db:generate`
Expected: Prisma client updated successfully

### Task 2: API module and focused service verification

**Files:**

- Create: `apps/api/src/modules/football/asset-record/asset-record.module.ts`
- Create: `apps/api/src/modules/football/asset-record/asset-record.controller.ts`
- Create: `apps/api/src/modules/football/asset-record/asset-record.service.ts`
- Create: `apps/api/src/modules/football/asset-record/asset-record.service.spec.ts`
- Create: `apps/api/src/modules/football/asset-record/dto/create-asset-record.dto.ts`
- Create: `apps/api/src/modules/football/asset-record/dto/update-asset-record.dto.ts`
- Create: `apps/api/src/modules/football/asset-record/dto/asset-record-list.dto.ts`
- Modify: `apps/api/src/modules/football/football.module.ts`
- Test: `pnpm --filter @gaoge/app-api test -- asset-record.service.spec.ts --runInBand`

- [ ] **Step 1: Add a focused failing service spec**

```ts
it('forces waived match fee records to be income with zero amount', async () => {
  await expect(
    service.create(
      {
        direction: 'expense',
        recordType: 'match_fee',
        amount: 100,
        isWaived: true,
        title: 'bad record',
        recordDate: new Date('2026-03-01'),
        status: 'confirmed',
      } as any,
      1,
    ),
  ).rejects.toThrow('免收记录仅允许比赛收入且金额必须为 0')
})

it('returns confirmed totals only in summary', async () => {
  prisma.footballAssetRecord.aggregate = jest
    .fn()
    .mockResolvedValueOnce({ _sum: { amount: 120000 } })
    .mockResolvedValueOnce({ _sum: { amount: 66800 } })
  prisma.footballAssetRecord.count = jest.fn().mockResolvedValue(1)

  await expect(service.getSummary()).resolves.toEqual({
    totalIncome: 120000,
    totalExpense: 66800,
    balance: 53200,
    waivedMatchCount: 1,
  })
})
```

- [ ] **Step 2: Run the focused spec and confirm red**

Run: `pnpm --filter @gaoge/app-api test -- asset-record.service.spec.ts --runInBand`
Expected: FAIL because module/service do not exist yet

- [ ] **Step 3: Implement DTOs, service, controller, and module**

Key implementation points:

```ts
// service responsibilities
// - build paginated where conditions
// - normalize empty strings to null
// - validate direction + recordType combinations
// - validate waived record rules
// - compute summary from confirmed records only
```

```ts
// controller routes
@Controller('football/asset-records')
@Get()
@Get('summary')
@Get(':id')
@Post()
@Patch(':id')
@Delete(':id')
```

- [ ] **Step 4: Register the module under football**

Add `AssetRecordModule` to `apps/api/src/modules/football/football.module.ts`.

- [ ] **Step 5: Re-run the focused service spec**

Run: `pnpm --filter @gaoge/app-api test -- asset-record.service.spec.ts --runInBand`
Expected: PASS

### Task 3: Admin API, route, search/table/form schemas, and CRUD page

**Files:**

- Create: `apps/admin/src/api/football/asset-record/index.ts`
- Modify: `apps/admin/src/router/modules/football/index.ts`
- Create: `apps/admin/src/views/football/asset_record/index.vue`
- Create: `apps/admin/src/views/football/asset_record/auth.ts`
- Create: `apps/admin/src/views/football/asset_record/model/defaults.ts`
- Create: `apps/admin/src/views/football/asset_record/model/types.ts`
- Create: `apps/admin/src/views/football/asset_record/model/mapper.ts`
- Create: `apps/admin/src/views/football/asset_record/schemas/search.ts`
- Create: `apps/admin/src/views/football/asset_record/schemas/form.ts`
- Create: `apps/admin/src/views/football/asset_record/schemas/table.ts`
- Create: `apps/admin/src/views/football/asset_record/components/AssetRecordForm.vue`
- Create: `apps/admin/src/views/football/asset_record/components/AssetRecordFormDialog.vue`
- Test: `pnpm --filter @gaoge/app-admin typecheck`

- [ ] **Step 1: Mirror the player page contract in the admin API**

```ts
export default {
  list: (params?: AssetRecordListParams) =>
    api.get<AssetRecordListResponse>('/football/asset-records', { params }),
  summary: () => api.get<AssetRecordSummary>('/football/asset-records/summary'),
  create: (data: AssetRecordPayload) => api.post<AssetRecord>('/football/asset-records', data),
  update: (id: number, data: AssetRecordPayload) =>
    api.patch<AssetRecord>(`/football/asset-records/${id}`, data),
  remove: (id: number) => api.delete<AssetRecord>(`/football/asset-records/${id}`),
}
```

- [ ] **Step 2: Add the football submenu route**

Use the same route style as `player/team/match-round`, with:

```ts
{
  path: 'asset-record',
  name: 'assetRecord',
  component: () => import('@/views/football/asset_record/index.vue'),
  meta: { title: '资产信息' },
}
```

- [ ] **Step 3: Build model/search/table/form schema files**

Key schema expectations:

```ts
// search
keyword / direction / recordType / seasonLabel / status / dateRange

// table
recordDate / direction / recordType / amount / seasonLabel / matchLabel /
status / title / description / createdAt / updatedAt / actions

// form
direction + recordType linkage
isWaived visible only for income + match_fee
amount disabled and forced to 0 when isWaived = true
```

- [ ] **Step 4: Implement the page and form dialog**

Key page behavior:

```ts
// index.vue
// - useListPage for list state
// - useCrudDialog for create/edit
// - request summary on mounted
// - refresh summary after create/update/delete
// - expose separate "新增收入" and "新增支出" entry points
```

- [ ] **Step 5: Run admin typecheck**

Run: `pnpm --filter @gaoge/app-admin typecheck`
Expected: PASS

### Task 4: Integrated verification and cleanup

**Files:**

- Verify only: backend and admin touched files from Tasks 1-3

- [ ] **Step 1: Run backend focused checks**

Run:

```bash
pnpm --filter @gaoge/app-api test -- asset-record.service.spec.ts --runInBand
pnpm --filter @gaoge/app-api typecheck
```

Expected: PASS

- [ ] **Step 2: Run admin focused checks**

Run:

```bash
pnpm --filter @gaoge/app-admin typecheck
```

Expected: PASS

- [ ] **Step 3: Run one final repo-level sanity check**

Run: `pnpm lint`
Expected: PASS, or if the repo has unrelated existing failures, capture them explicitly before finishing

- [ ] **Step 4: Manual smoke verification**

Check these behaviors:

```text
1. 资产信息菜单可见并能进入页面
2. 汇总卡片显示总收入、总支出、结余、免收场次
3. 新增收入成功
4. 新增支出成功
5. 新增免收比赛收费成功，金额自动为 0
6. 编辑记录后列表与汇总同步刷新
7. 删除记录后列表与汇总同步刷新
```
