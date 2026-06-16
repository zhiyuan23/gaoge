# Banner 拖拽排序 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 admin Banner 管理页从手动排序改为仅在完整列表下可用的拖拽排序，并在拖拽后立即持久化。

**Architecture:** 后端在 Banner 模块新增一个局部批量重排接口，负责原子更新全部 `sort` 值；前端页面内直接接入表格拖拽，不扩展通用 `EsTable` 能力。拖拽仅在未筛选的完整列表下启用，成功后重新拉取列表。

**Tech Stack:** NestJS, Prisma, Vue 3, Element Plus, SortableJS, Jest, vue-tsc

---

### Task 1: 后端排序能力

**Files:**

- Modify: `apps/api/src/modules/sports/content/banner/banner.service.spec.ts`
- Modify: `apps/api/src/modules/sports/content/banner/banner.service.ts`
- Create: `apps/api/src/modules/sports/content/banner/dto/reorder-banner.dto.ts`
- Modify: `apps/api/src/modules/sports/content/banner/banner.controller.ts`
- Modify: `packages/shared/types/src/banner.ts`

- [ ] **Step 1: Write the failing test**

在 `apps/api/src/modules/sports/content/banner/banner.service.spec.ts` 增加 2 个测试：

```ts
it('reorders banners in a transaction and returns sorted list', async () => {
  const { prisma, service } = createService()

  prisma.banner.findMany.mockResolvedValue([
    { id: 12, sort: 300 },
    { id: 9, sort: 200 },
    { id: 3, sort: 100 },
  ])

  prisma.$transaction = jest.fn(async (callback: any) => {
    await callback({
      banner: {
        findMany: jest.fn().mockResolvedValue([{ id: 3 }, { id: 9 }, { id: 12 }]),
        update: jest.fn().mockResolvedValue(undefined),
      },
    })
    return prisma.banner.findMany()
  })

  await service.reorder({
    items: [
      { id: 12, sort: 300 },
      { id: 9, sort: 200 },
      { id: 3, sort: 100 },
    ],
  })

  expect(prisma.$transaction).toHaveBeenCalled()
  expect(prisma.banner.findMany).toHaveBeenCalledWith({
    orderBy: [{ sort: 'desc' }, { id: 'desc' }],
  })
})

it('rejects reorder when any banner id is missing', async () => {
  const { prisma, service } = createService()

  prisma.$transaction = jest.fn(async (callback: any) => {
    return callback({
      banner: {
        findMany: jest.fn().mockResolvedValue([{ id: 12 }]),
        update: jest.fn(),
      },
    })
  })

  await expect(
    service.reorder({
      items: [
        { id: 12, sort: 200 },
        { id: 99, sort: 100 },
      ],
    }),
  ).rejects.toThrow('部分 Banner 不存在，无法排序')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @gaoge/app-api test -- banner.service.spec.ts`
Expected: FAIL because `reorder` and the reorder DTO/types do not exist yet.

- [ ] **Step 3: Write minimal implementation**

实现内容：

- 在 `packages/shared/types/src/banner.ts` 增加：

```ts
export interface ReorderBannerItemPayload {
  id: number
  sort: number
}

export interface ReorderBannerPayload {
  items: ReorderBannerItemPayload[]
}
```

- 新增 `apps/api/src/modules/sports/content/banner/dto/reorder-banner.dto.ts`
- 在 `BannerService` 中增加 `reorder(dto)`，事务内校验 ID 完整性并逐条更新
- 在 `BannerController` 中增加 `PATCH /content/banners/reorder`

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @gaoge/app-api test -- banner.service.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/shared/types/src/banner.ts apps/api/src/modules/sports/content/banner
git commit -m "feat(api): add banner reorder endpoint"
```

### Task 2: Admin 页面拖拽排序

**Files:**

- Modify: `apps/admin/src/api/content/banner/index.ts`
- Modify: `apps/admin/src/views/sports/content/banner/index.vue`
- Modify: `apps/admin/package.json`

- [ ] **Step 1: Write the failing test**

这次前端先用类型和构建校验替代组件测试，先写会引用但尚不存在的 API 与状态：

- 在 `index.vue` 中先接入 `reorder` 调用和拖拽初始化逻辑草稿
- 在 `apps/admin/src/api/content/banner/index.ts` 中先引用 `ReorderBannerPayload`

预期这一步会因为类型和依赖未补齐而无法通过。

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @gaoge/app-admin typecheck`
Expected: FAIL because reorder API typing or `sortablejs` dependency is missing.

- [ ] **Step 3: Write minimal implementation**

实现内容：

- `apps/admin/package.json` 增加 `sortablejs`
- `apps/admin/src/api/content/banner/index.ts` 增加：

```ts
reorder: (data: ReorderBannerPayload) => api.patch<Banner[]>('/content/banners/reorder', data)
```

- `apps/admin/src/views/sports/content/banner/index.vue` 增加：
  - 是否为默认搜索条件的计算属性
  - 表格容器 `ref`
  - `Sortable` 初始化与销毁
  - `onEnd` 后生成新的 `items` 并立即保存
  - 保存失败后刷新列表回滚
  - 筛选状态下的禁用提示

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @gaoge/app-admin typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/admin/package.json apps/admin/src/api/content/banner/index.ts apps/admin/src/views/sports/content/banner/index.vue
git commit -m "feat(admin): support banner drag sorting"
```

### Task 3: 联调校验

**Files:**

- No code changes required unless verification reveals issues

- [ ] **Step 1: Run backend test**

Run: `pnpm --filter @gaoge/app-api test -- banner.service.spec.ts`
Expected: PASS

- [ ] **Step 2: Run admin typecheck**

Run: `pnpm --filter @gaoge/app-admin typecheck`
Expected: PASS

- [ ] **Step 3: Run lint if touched files require cleanup**

Run: `pnpm --filter @gaoge/app-admin lint`
Expected: PASS or only unrelated pre-existing issues

- [ ] **Step 4: Manual verification checklist**

- 打开 Banner 管理页
- 保持默认列表时可拖拽
- 拖拽后出现成功提示，刷新后顺序保持一致
- 输入任意筛选条件后不可拖拽，并看到禁用提示
