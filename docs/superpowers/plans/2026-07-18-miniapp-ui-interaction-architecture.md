# Miniapp UI Interaction Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first usable Skyline miniapp UI foundation from the approved design: theme tokens, base components, shell navigation, and four main tab pages.

**Architecture:** Keep `apps/miniapp` as a WeChat native Skyline/glass-easel app. Extend the existing `styles/*`, `components/base`, `components/shell`, `components/event`, `pages/*`, and `config/routes.ts` structure instead of introducing a third-party UI library.

**Tech Stack:** WeChat native miniapp, Skyline renderer, glass-easel components, TypeScript, WXSS, Node.js verification script, existing `pnpm --filter @gaoge/app-miniapp typecheck` and `pnpm ci:miniapp:quality`.

## Global Constraints

- `apps/miniapp` remains a WeChat native miniapp using `renderer: skyline` and `componentFramework: glass-easel`.
- Do not introduce TDesign, Vant, WeUI, Tailwind, UnoCSS, Vue, React, Taro, or uni-app into `apps/miniapp`.
- Runtime TypeScript imports inside `apps/miniapp/miniprogram` use relative paths, not `@/`.
- Page navigation paths are managed by `apps/miniapp/miniprogram/config/routes.ts`; pages must not hard-code route strings when navigating.
- Main tab pages are `home`, `schedule`, `standings`, and `profile`.
- Main CTA color is `#16e66d`; page background is `#f4f7f5`; inverse surface is `#101417`; accent is `#ffb020`.
- Primary touch targets are at least `88rpx` high.
- Components in `components/base` have no business service calls and no business routes.
- Components in `components/event` do not fetch data; pages own data and pass display properties down.
- Keep implementation incremental and verifiable with typecheck and miniapp quality checks.

---

## File Structure

Create:

- `apps/miniapp/scripts/check-ui-architecture.mjs`: local assertion script for required tokens, component files, pages, and route entries.
- `apps/miniapp/miniprogram/components/base/gg-button/index.{json,ts,wxml,wxss}`: reusable button with variants, loading, disabled, and press state.
- `apps/miniapp/miniprogram/components/base/gg-tag/index.{json,ts,wxml,wxss}`: reusable semantic tag.
- `apps/miniapp/miniprogram/components/base/gg-card/index.{json,ts,wxml,wxss}`: reusable card wrapper.
- `apps/miniapp/miniprogram/components/base/gg-empty/index.{json,ts,wxml,wxss}`: reusable empty state.
- `apps/miniapp/miniprogram/components/base/gg-tabs/index.{json,ts,wxml,wxss}`: reusable tab selector.
- `apps/miniapp/miniprogram/components/shell/app-tabbar/index.{json,ts,wxml,wxss}`: custom four-tab shell navigation.
- `apps/miniapp/miniprogram/components/shell/app-action-bar/index.{json,ts,wxml,wxss}`: fixed bottom action bar for detail flows.
- `apps/miniapp/miniprogram/components/event/event-hero/index.{json,ts,wxml,wxss}`: season hero.
- `apps/miniapp/miniprogram/components/event/match-card/index.{json,ts,wxml,wxss}`: match/schedule card.
- `apps/miniapp/miniprogram/components/event/standings-row/index.{json,ts,wxml,wxss}`: ranking row.
- `apps/miniapp/miniprogram/pages/schedule/index.{json,ts,wxml,wxss}`: main schedule tab.
- `apps/miniapp/miniprogram/pages/standings/index.{json,ts,wxml,wxss}`: main standings tab.
- `apps/miniapp/miniprogram/pages/profile/index.{json,ts,wxml,wxss}`: main profile tab.

Modify:

- `apps/miniapp/package.json`: add `check:ui` script.
- `apps/miniapp/miniprogram/app.json`: register main pages.
- `apps/miniapp/miniprogram/config/routes.ts`: keep four main tab route entries aligned with `app.json`.
- `apps/miniapp/miniprogram/styles/tokens.wxss`: add approved semantic tokens.
- `apps/miniapp/miniprogram/styles/spacing.wxss`: add spacing helpers.
- `apps/miniapp/miniprogram/styles/typography.wxss`: add text helpers.
- `apps/miniapp/miniprogram/styles/layout.wxss`: add card/page/action spacing helpers.
- `apps/miniapp/miniprogram/styles/motion.wxss`: add press feedback helpers.
- `apps/miniapp/miniprogram/components/shell/app-page/index.{json,ts,wxml,wxss}`: support tabbar padding, page state slots, and custom page layout.
- `apps/miniapp/miniprogram/components/shell/app-nav/index.{ts,wxml,wxss}`: support visual variant and right slot.
- `apps/miniapp/miniprogram/pages/home/index.{json,ts,wxml,wxss}`: replace bootstrap placeholder with the approved赛事俱乐部型 homepage.

## Task 1: UI Architecture Check Script

**Files:**

- Create: `apps/miniapp/scripts/check-ui-architecture.mjs`
- Modify: `apps/miniapp/package.json`

**Interfaces:**

- Consumes: filesystem paths under `apps/miniapp/miniprogram`.
- Produces: `pnpm --filter @gaoge/app-miniapp check:ui`, a local assertion command used by later tasks.

- [ ] **Step 1: Write the failing check script**

Create `apps/miniapp/scripts/check-ui-architecture.mjs` with Node `fs` assertions for:

```js
import { readFileSync } from 'node:fs'
import { access } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const root = fileURLToPath(new URL('..', import.meta.url))
const miniRoot = join(root, 'miniprogram')

const requiredFiles = [
  'components/base/gg-button/index.json',
  'components/base/gg-button/index.ts',
  'components/base/gg-button/index.wxml',
  'components/base/gg-button/index.wxss',
  'components/base/gg-tag/index.json',
  'components/base/gg-card/index.json',
  'components/base/gg-empty/index.json',
  'components/base/gg-tabs/index.json',
  'components/shell/app-tabbar/index.json',
  'components/shell/app-action-bar/index.json',
  'components/event/event-hero/index.json',
  'components/event/match-card/index.json',
  'components/event/standings-row/index.json',
  'pages/schedule/index.json',
  'pages/standings/index.json',
  'pages/profile/index.json',
]

const requiredTokens = [
  '--gg-color-primary: #16e66d',
  '--gg-color-surface-inverse: #101417',
  '--gg-color-accent: #ffb020',
  '--gg-radius-md',
  '--gg-shadow-card',
]

const requiredPages = [
  'pages/home/index',
  'pages/schedule/index',
  'pages/standings/index',
  'pages/profile/index',
]

const requiredRoutes = [
  "home: '/pages/home/index'",
  "schedule: '/pages/schedule/index'",
  "standings: '/pages/standings/index'",
  "profile: '/pages/profile/index'",
]

async function assertFile(path) {
  await access(join(miniRoot, path))
}

function assertIncludes(source, value, label) {
  if (!source.includes(value)) {
    throw new Error(`${label} missing ${value}`)
  }
}

await Promise.all(requiredFiles.map(assertFile))

const tokens = readFileSync(join(miniRoot, 'styles/tokens.wxss'), 'utf8')
for (const token of requiredTokens) {
  assertIncludes(tokens, token, 'tokens.wxss')
}

const appJson = JSON.parse(readFileSync(join(miniRoot, 'app.json'), 'utf8'))
for (const page of requiredPages) {
  if (!appJson.pages.includes(page)) {
    throw new Error(`app.json missing page ${page}`)
  }
}

const routes = readFileSync(join(miniRoot, 'config/routes.ts'), 'utf8')
for (const route of requiredRoutes) {
  assertIncludes(routes, route, 'routes.ts')
}
```

- [ ] **Step 2: Add package script**

Modify `apps/miniapp/package.json` scripts:

```json
"check:ui": "node scripts/check-ui-architecture.mjs"
```

- [ ] **Step 3: Run check to verify it fails**

Run: `pnpm --filter @gaoge/app-miniapp check:ui`

Expected: FAIL because `components/base/gg-button/index.json` does not exist.

- [ ] **Step 4: Commit**

Run:

```bash
git add apps/miniapp/package.json apps/miniapp/scripts/check-ui-architecture.mjs
git commit -m "test: add miniapp ui architecture check"
```

## Task 2: Theme Tokens and Base Components

**Files:**

- Modify: `apps/miniapp/miniprogram/styles/tokens.wxss`
- Modify: `apps/miniapp/miniprogram/styles/spacing.wxss`
- Modify: `apps/miniapp/miniprogram/styles/typography.wxss`
- Modify: `apps/miniapp/miniprogram/styles/layout.wxss`
- Modify: `apps/miniapp/miniprogram/styles/motion.wxss`
- Create: `apps/miniapp/miniprogram/components/base/gg-button/index.{json,ts,wxml,wxss}`
- Create: `apps/miniapp/miniprogram/components/base/gg-tag/index.{json,ts,wxml,wxss}`
- Create: `apps/miniapp/miniprogram/components/base/gg-card/index.{json,ts,wxml,wxss}`
- Create: `apps/miniapp/miniprogram/components/base/gg-empty/index.{json,ts,wxml,wxss}`
- Create: `apps/miniapp/miniprogram/components/base/gg-tabs/index.{json,ts,wxml,wxss}`

**Interfaces:**

- Consumes: Task 1 `check:ui` script.
- Produces: reusable base components with properties:
  - `gg-button`: `variant`, `size`, `loading`, `disabled`, `block`
  - `gg-tag`: `tone`, `text`
  - `gg-card`: `interactive`
  - `gg-empty`: `title`, `description`, `actionText`
  - `gg-tabs`: `items`, `value`; emits `change` with `{ value: string }`

- [ ] **Step 1: Run failing check before implementation**

Run: `pnpm --filter @gaoge/app-miniapp check:ui`

Expected: FAIL with missing component files.

- [ ] **Step 2: Expand style tokens**

Update `tokens.wxss` with the approved color, radius, shadow, and z-index variables from the spec.

- [ ] **Step 3: Add base component files**

Implement the five `components/base` components listed above. Keep TypeScript component files simple `Component({ properties, methods })` definitions and do not import services or routes.

- [ ] **Step 4: Run checks**

Run: `pnpm --filter @gaoge/app-miniapp check:ui`

Expected: still FAIL because shell/event components and pages are not created yet.

Run: `pnpm --filter @gaoge/app-miniapp typecheck`

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add apps/miniapp/miniprogram/styles apps/miniapp/miniprogram/components/base
git commit -m "feat(miniapp): add ui tokens and base components"
```

## Task 3: Shell Components and Main Page Container

**Files:**

- Modify: `apps/miniapp/miniprogram/components/shell/app-page/index.{json,ts,wxml,wxss}`
- Modify: `apps/miniapp/miniprogram/components/shell/app-nav/index.{ts,wxml,wxss}`
- Create: `apps/miniapp/miniprogram/components/shell/app-tabbar/index.{json,ts,wxml,wxss}`
- Create: `apps/miniapp/miniprogram/components/shell/app-action-bar/index.{json,ts,wxml,wxss}`

**Interfaces:**

- Consumes: `Routes` from `../../../config/routes` via relative import in `app-tabbar`.
- Produces:
  - `app-page` properties: `title`, `showBack`, `tabbar`, `navVariant`
  - `app-tabbar` property: `current`; method navigates via `wx.switchTab`
  - `app-action-bar` slots for detail-page fixed actions

- [ ] **Step 1: Run failing check before implementation**

Run: `pnpm --filter @gaoge/app-miniapp check:ui`

Expected: FAIL with missing `components/shell/app-tabbar/index.json`.

- [ ] **Step 2: Implement shell components**

Add `app-tabbar` with four items: `home`, `schedule`, `standings`, `profile`. Use text icons or CSS-only marks for now; do not add bitmap assets in this task.

- [ ] **Step 3: Update `app-page`**

Make `app-page` render:

```xml
<app-nav title="{{title}}" showBack="{{showBack}}" variant="{{navVariant}}" bind:back="onNavBack" />
<scroll-view ...>
  <view class="app-page__content app-page__content--tabbar-{{tabbar}}">
    <slot />
  </view>
</scroll-view>
<app-tabbar wx:if="{{tabbar}}" current="{{currentTab}}" />
```

- [ ] **Step 4: Run checks**

Run: `pnpm --filter @gaoge/app-miniapp typecheck`

Expected: PASS.

Run: `pnpm --filter @gaoge/app-miniapp check:ui`

Expected: still FAIL because event components and pages are not created yet.

- [ ] **Step 5: Commit**

Run:

```bash
git add apps/miniapp/miniprogram/components/shell
git commit -m "feat(miniapp): add app shell tabbar and action bar"
```

## Task 4: Event Components and Four Main Pages

**Files:**

- Create: `apps/miniapp/miniprogram/components/event/event-hero/index.{json,ts,wxml,wxss}`
- Create: `apps/miniapp/miniprogram/components/event/match-card/index.{json,ts,wxml,wxss}`
- Create: `apps/miniapp/miniprogram/components/event/standings-row/index.{json,ts,wxml,wxss}`
- Modify: `apps/miniapp/miniprogram/pages/home/index.{json,ts,wxml,wxss}`
- Create: `apps/miniapp/miniprogram/pages/schedule/index.{json,ts,wxml,wxss}`
- Create: `apps/miniapp/miniprogram/pages/standings/index.{json,ts,wxml,wxss}`
- Create: `apps/miniapp/miniprogram/pages/profile/index.{json,ts,wxml,wxss}`
- Modify: `apps/miniapp/miniprogram/app.json`

**Interfaces:**

- Consumes: base components, shell components, and existing `Routes`.
- Produces four tab pages registered in `app.json`.

- [ ] **Step 1: Run failing check before implementation**

Run: `pnpm --filter @gaoge/app-miniapp check:ui`

Expected: FAIL with missing `components/event/event-hero/index.json` or missing page files.

- [ ] **Step 2: Implement event components**

Create display-only components:

- `event-hero`: season name, status, summary fields, primary/secondary action labels.
- `match-card`: title, time, location, status text, meta text, action text.
- `standings-row`: rank, team name, record, points, trend.

- [ ] **Step 3: Implement main pages**

Use static page-local mock data for first UI pass:

- Home: season hero, next match, quick actions, schedule preview, standings preview.
- Schedule: round/status tabs and match cards.
- Standings: season selector visual and ranking rows.
- Profile: login/bind-player service desk layout with my registration/check-in/share entries.

- [ ] **Step 4: Register pages**

Update `app.json` pages to include:

```json
["pages/home/index", "pages/schedule/index", "pages/standings/index", "pages/profile/index"]
```

- [ ] **Step 5: Run checks**

Run: `pnpm --filter @gaoge/app-miniapp check:ui`

Expected: PASS.

Run: `pnpm --filter @gaoge/app-miniapp typecheck`

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add apps/miniapp/miniprogram/app.json apps/miniapp/miniprogram/components/event apps/miniapp/miniprogram/pages
git commit -m "feat(miniapp): add main event ui pages"
```

## Task 5: Polish, Quality Check, and Documentation Alignment

**Files:**

- Modify: `apps/miniapp/miniprogram/styles/tokens.wxss` only if verification finds token formatting or naming issues.
- Modify: `apps/miniapp/miniprogram/components/shell/app-page/index.wxss` only if tabbar bottom padding overlaps content.
- Modify: `apps/miniapp/miniprogram/pages/home/index.wxss` only if first-screen text or CTA spacing overlaps at 375px width.
- Modify: `apps/miniapp/miniprogram/pages/schedule/index.wxss` only if match card text wraps outside the card.
- Modify: `apps/miniapp/miniprogram/pages/standings/index.wxss` only if ranking row columns overflow.
- Modify: `apps/miniapp/miniprogram/pages/profile/index.wxss` only if touch targets are below `88rpx`.
- Modify: `docs/conventions/miniapp-architecture.md` only if implementation adds a durable convention not already covered.

**Interfaces:**

- Consumes: Tasks 1-4.
- Produces: final checked implementation.

- [ ] **Step 1: Run full miniapp verification**

Run:

```bash
pnpm --filter @gaoge/app-miniapp check:ui
pnpm --filter @gaoge/app-miniapp typecheck
pnpm ci:miniapp:quality
```

Expected: all commands exit 0. If `pnpm ci:miniapp:quality` fails because WeChat CI credentials or appid are unavailable, capture the exact error and still run the local checks.

- [ ] **Step 2: Fix verification failures**

For each failing command, fix only the files related to the failure and rerun the same command until it exits 0 or until the failure is confirmed to be environment-only.

- [ ] **Step 3: Inspect route and component consistency**

Run:

```bash
pnpm --filter @gaoge/app-miniapp check:ui
pnpm --filter @gaoge/app-miniapp typecheck
```

Expected: both PASS.

- [ ] **Step 4: Commit final polish**

Run:

```bash
git add apps/miniapp docs/conventions/miniapp-architecture.md
git commit -m "chore(miniapp): verify ui architecture implementation"
```

Skip this commit if there are no changes after Task 4.
