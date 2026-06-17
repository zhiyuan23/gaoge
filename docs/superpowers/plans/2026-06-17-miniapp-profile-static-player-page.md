# Miniapp Profile Static Player Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `apps/miniapp/src/pages/profile/index.vue` with a static player showcase page that matches the approved screenshot structure and uses only local static data.

**Architecture:** Keep the work isolated to the existing page file plus this plan artifact. Remove the current profile binding/editing logic, replace it with a single-file static Vue page driven by one local data object, and implement the visual sections with scoped SCSS rather than introducing new shared abstractions.

**Tech Stack:** Vue 3 `script setup`, uni-app page conventions, scoped SCSS, existing miniapp workspace typecheck via `vue-tsc`

---

### Task 1: Lock execution scope and replace the page implementation

**Files:**

- Modify: `apps/miniapp/src/pages/profile/index.vue`
- Reference: `docs/superpowers/specs/2026-06-17-miniapp-profile-static-player-page-design.md`

- [ ] **Step 1: Review the current page and approved spec before editing**

Read:

```bash
sed -n '1,260p' apps/miniapp/src/pages/profile/index.vue
sed -n '1,260p' docs/superpowers/specs/2026-06-17-miniapp-profile-static-player-page-design.md
```

Expected: confirm the current page still contains binding/editing logic and the spec still requires full static replacement.

- [ ] **Step 2: Replace the old script with static page data only**

Write `script setup` that:

- removes all API imports, store usage, and async lifecycle logic
- defines a single static `playerProfile` object
- defines a static `tabs` array
- optionally defines a small `abilityPolygon` computed string if the radar graphic needs inline coordinates

Implementation shape:

```ts
const tabs = ['数据', '比赛', '能力值', '动态', '资料']

const playerProfile = {
  name: '梅西',
  englishName: 'L.Messi',
  team: '迈阿密国际',
  nation: '阿根廷',
  country: '西班牙',
  height: 170,
  weight: 72,
  age: 38,
  position: '前锋',
  marketValue: '1500万欧',
  teamNumber: '迈阿密国际/10号',
  nationNumber: '阿根廷/10号',
  overall: 86,
  abilities: [
    { label: '速度', value: 77, tone: 'amber' },
    { label: '射门', value: 84, tone: 'orange' },
    { label: '传球', value: 86, tone: 'orange' },
    { label: '盘带', value: 87, tone: 'orange' },
    { label: '防守', value: 36, tone: 'green' },
    { label: '身体素质', value: 63, tone: 'amber' },
  ],
}
```

- [ ] **Step 3: Replace the old template with the approved static layout**

Build these sections in order:

- green hero header with status spacing, back arrow, app pill, more dots
- player avatar/name/meta block
- three-column summary metrics row
- white tabs bar with “能力值” active
- “综合能力” section with score card, static image-action affordance, radar area, six labels
- “位置介绍” section with CSS pitch, `ST` marker, text descriptions, left-foot highlight shoes

Template shape:

```vue
<template>
  <view class="profile-page">
    <view class="hero-section"> ... </view>
    <view class="tab-bar"> ... </view>
    <view class="section section-abilities"> ... </view>
    <view class="section section-position"> ... </view>
  </view>
</template>
```

- [ ] **Step 4: Replace the old styles with page-scoped visual styles**

Write scoped SCSS that:

- sets the page background and spacing
- builds the green hero panel and faded crest-like background
- creates the circular avatar placeholder without remote image dependency
- styles the tabs, score card, labels, and two-column position area
- draws the pitch, boots, and radar chart with CSS-only shapes

Keep styles local to the page and avoid new shared classes or files.

- [ ] **Step 5: Manually review the rewritten file for scope leaks**

Run:

```bash
rg -n "bindFootballPlayer|requestBindOptions|updateMiniappProfile|uploadMiniappAvatar|useAuthStore|Toast|profile-binding" apps/miniapp/src/pages/profile/index.vue
```

Expected: no matches, proving the old binding/editing implementation has been fully removed from this page.

### Task 2: Verify the page compiles within the miniapp workspace

**Files:**

- Verify: `apps/miniapp/src/pages/profile/index.vue`

- [ ] **Step 1: Run miniapp typecheck**

Run:

```bash
pnpm --filter @gaoge/app-miniapp typecheck
```

Expected: exit code `0`.

- [ ] **Step 2: Inspect the resulting diff to confirm only the intended page changed for implementation**

Run:

```bash
git diff -- apps/miniapp/src/pages/profile/index.vue docs/superpowers/plans/2026-06-17-miniapp-profile-static-player-page.md
```

Expected: the diff shows the new plan file plus the full page rewrite, with no unrelated file edits introduced by this task.

- [ ] **Step 3: Record verification limits in the final handoff**

State explicitly in the final report:

- `pnpm --filter @gaoge/app-miniapp typecheck` was run
- no page-level automated UI tests were added
- no true device or visual screenshot QA was run in this task
