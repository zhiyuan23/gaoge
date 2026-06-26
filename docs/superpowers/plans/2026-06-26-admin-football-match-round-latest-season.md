# 足球比赛信息默认赛季 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让足球比赛信息页默认筛选最新比赛所属赛季，同时以同一条记录稳定驱动新增比赛的预填值。

**Architecture:** 页面初始化先以固定默认年度请求一条按服务端既有排序返回的最新比赛，再将其赛季同步到搜索状态并请求列表。页面保存或删除后重新读取该元数据；仅当搜索条件仍等于页面默认条件时，才更新赛季筛选，避免覆盖手动筛选。`previousMatchRound` 不再由已筛选和分页的表格数据反推。

**Tech Stack:** Vue 3 Composition API、TypeScript、Element Plus、既有 `useListPage` 和足球比赛轮次 REST API。

> **实施更新：** 最终需求以全局最新比赛记录的 `year` 和 `season` 作为默认查询条件，不再固定年度 `2026`。搜索字段的重置恢复该动态条件；用户清空年度或赛季时仍表示“全部”。本说明优先于下方的初始实施步骤。

## Global Constraints

- 仅修改 `apps/admin` 足球比赛信息页面，不改 API、共享包或篮球模块。
- 默认年度保持 `2026`，最新比赛的排序继续由服务端 `matchDate desc, createdAt desc` 决定。
- 不新增依赖或测试框架；以 admin TypeScript 校验和生产构建验证。
- 保持现有 Prettier、ESLint、Stylelint 风格。

---

### Task 1: 建立最新比赛元数据与默认筛选流程

**Files:**

- Modify: `apps/admin/src/views/sports/football/match-round/index.vue:43-127`
- Test: `apps/admin` typecheck/build commands

**Interfaces:**

- Consumes: `matchRoundsApi.list({ page: 1, pageSize: 1, year: 2026 })` returning `{ list: MatchRound[]; total: number }`.
- Produces: `previousMatchRound: Ref<MatchRound | null>` that always holds the latest match in the default year, and `search.season` initialized from it.

- [ ] **Step 1: Add the failing page-state expectation to the implementation notes**

  In `index.vue`, identify the existing behavior that calls `fetchMatchRounds()` directly in `onMounted` and assigns `previousMatchRound` from `tableData[0]`. Record the target invariant in a code comment immediately above the new loader:

  ```ts
  // 最新比赛独立于当前赛季筛选和分页，用于默认赛季及新增比赛预填。
  ```

- [ ] **Step 2: Run the baseline type check**

  Run: `pnpm --filter @gaoge/app-admin typecheck`

  Expected: PASS before the change; this establishes the existing page compiles.

- [ ] **Step 3: Replace table-derived latest-match state with a one-record loader**

  In `apps/admin/src/views/sports/football/match-round/index.vue`, add a local `latestSeason` ref and these helpers after `teamsWarning`:

  ```ts
  const latestSeason = ref<MatchRoundSearchSeason>('')

  function isDefaultSearch() {
    return (
      search.value.year === MATCH_ROUND_DEFAULT_SEARCH.year &&
      search.value.season === latestSeason.value &&
      search.value.round === MATCH_ROUND_DEFAULT_SEARCH.round &&
      search.value.matchDate === MATCH_ROUND_DEFAULT_SEARCH.matchDate &&
      search.value.venueKeyword === MATCH_ROUND_DEFAULT_SEARCH.venueKeyword
    )
  }

  async function refreshLatestMatchRound() {
    const response = await matchRoundsApi.list({
      page: 1,
      pageSize: 1,
      year: MATCH_ROUND_DEFAULT_SEARCH.year || undefined,
    })
    previousMatchRound.value = response.list[0] ?? null
    latestSeason.value = previousMatchRound.value?.season ?? ''
  }

  async function initializeMatchRoundPageData() {
    await refreshLatestMatchRound()
    search.value.season = latestSeason.value
    await fetchMatchRounds()
  }
  ```

  Delete `shouldSyncPreviousMatchRoundFromTable`. Change `onMounted` to call `initializeMatchRoundPageData()` instead of `fetchMatchRounds()`, and reduce the `watch(tableData, ...)` callback to clearing `selectionDataList` only.

- [ ] **Step 4: Run the type check to verify the page-state implementation compiles**

  Run: `pnpm --filter @gaoge/app-admin typecheck`

  Expected: PASS.

- [ ] **Step 5: Commit the isolated state-loading change**

  ```bash
  git add apps/admin/src/views/sports/football/match-round/index.vue
  git commit -m "feat(admin): default football matches to latest season"
  ```

### Task 2: Refresh metadata after mutations without overwriting manual filters

**Files:**

- Modify: `apps/admin/src/views/sports/football/match-round/index.vue:151-187`
- Test: `apps/admin` typecheck/build commands

**Interfaces:**

- Consumes: `isDefaultSearch(): boolean`, `refreshLatestMatchRound(): Promise<void>`, and `fetchMatchRounds(): Promise<void>` from Task 1.
- Produces: `refreshMatchRoundListData(): Promise<void>` that refreshes latest-match metadata after a mutation and preserves non-default filter state.

- [ ] **Step 1: State the failing mutation invariant in a code comment**

  Add this comment immediately above the new refresh helper:

  ```ts
  // 仅在用户未修改默认筛选时，随最新比赛同步赛季；否则保留用户筛选。
  ```

- [ ] **Step 2: Implement the post-mutation refresh helper**

  Add this helper before `handleDelete`:

  ```ts
  async function refreshMatchRoundListData() {
    const shouldSyncDefaultSeason = isDefaultSearch()
    await refreshLatestMatchRound()

    if (shouldSyncDefaultSeason) {
      search.value.season = latestSeason.value
      page.value = 1
    }

    await fetchMatchRounds()
  }
  ```

  Replace the `await fetchMatchRounds()` calls after `matchRoundsApi.remove`, `matchRoundsApi.create`, and `matchRoundsApi.update` with `await refreshMatchRoundListData()`.

- [ ] **Step 3: Run the type check to verify mutation paths compile**

  Run: `pnpm --filter @gaoge/app-admin typecheck`

  Expected: PASS.

- [ ] **Step 4: Run the production build for template and bundler verification**

  Run: `pnpm --filter @gaoge/app-admin build`

  Expected: exit code 0 and a generated `apps/admin/dist` bundle.

- [ ] **Step 5: Perform a manual behavior check against the running admin app**

  Run: `pnpm dev:admin`

  Expected checks:
  1. Open 足球 → 比赛信息; the 2026 season control selects the latest match's season and the table only shows that season.
  2. Click 新增比赛; its season, round, and date derive from that latest match.
  3. Manually change or clear a filter, create or delete a match, and verify the chosen filters remain unchanged.
  4. With default filters, create or delete a match and verify the latest season and next-add defaults refresh.

- [ ] **Step 6: Commit the completed behavior**

  ```bash
  git add apps/admin/src/views/sports/football/match-round/index.vue
  git commit -m "fix(admin): refresh football match defaults"
  ```
