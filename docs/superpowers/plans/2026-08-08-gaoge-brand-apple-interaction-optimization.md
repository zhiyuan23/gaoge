# 高歌 Brand Apple 交互优化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不改变 Brand 现有内容、路由与暗色视觉方向的前提下，提升首页和 Group 页的导航一致性、背景媒体控制、能力弹层流动性、长页节奏与系统偏好适配。

**Architecture:** 首页视频播放状态由 `SkiingHero` 持有，经 `SkiingNavbar` 传给统一的 `BrandNavigation`。能力弹层继续使用原生 `dialog` 管理语义和焦点，但把内容状态与呈现状态拆开，并用现有 Framer Motion 从当前屏幕值重定向动画。Group 页只在既有组件与样式内调整导航映射、间距和反馈，不增加页面级状态或共享抽象。

**Tech Stack:** React 19、TypeScript、React Router、Framer Motion、Tailwind CSS、原生 CSS、Vitest、Testing Library

## Global Constraints

- 本次执行禁止使用 TDD 和 subagent；先完成整体实现，再统一更新测试并运行验证。
- 不新增 `/film` 路由、Group 页内目录、滚动进度、体育深链、依赖、设计系统或共享包抽象。
- 不修改 `apps/sports`、API、CMS、部署、数据模型和现有公开数据文案。
- 保持 1440×900、390×844 和 320×800 下无横向溢出。
- 弹层继续使用原生 `dialog`，保留 Escape、遮罩、关闭按钮、焦点进入与关闭后焦点归还。
- 动画只使用 `transform` 和 `opacity`；桌面采用 `spring`、`bounce: 0`、约 0.36 秒，移动端沿底部同路径进退。
- 保留 `prefers-reduced-motion`，并补充 `prefers-reduced-transparency` 与 `prefers-contrast`。

---

### Task 1: 首页导航与背景媒体控制

**Files:**

- Modify: `apps/brand/src/concepts/skiing/components/SkiingHero.tsx`
- Modify: `apps/brand/src/concepts/skiing/components/SkiingNavbar.tsx`
- Modify: `apps/brand/src/brand/components/BrandNavigation.tsx`

**Interfaces:**

- Produces: `BrandMediaControl { isPlaying: boolean; onToggle(): void }`
- Produces: `SkiingNavbarProps { isVideoPlaying: boolean; onToggleVideo(): void }`
- Consumes: existing `BrandNavigationHandle.openCapability(area, trigger)`

- [ ] **Step 1: Add controlled video playback state to `SkiingHero`**

  Keep `videoRef` as the source of truth for browser playback, mirror successful `play`, `pause`, `onPlay`, and `onPause` events into `isVideoPlaying`, and expose a toggle that calls `video.pause()` or the existing guarded `video.play()` path. When `useReducedMotion()` is true, render only the poster and omit the control.

- [ ] **Step 2: Pass the media control through `SkiingNavbar`**

  Define exact props `isVideoPlaying` and `onToggleVideo`, then pass `{ isPlaying: isVideoPlaying, onToggle: onToggleVideo }` to `BrandNavigation` as `mediaControl`.

- [ ] **Step 3: Upgrade the home navigation control cluster**

  Render a 44×44 pause/play button using `Pause` and `Play` from `lucide-react`, with accessible names `暂停背景视频` and `播放背景视频`. Change the group link accessible name and desktop label to `认识高歌集团`, while keeping compact visible text `集团` at widths up to 384px.

- [ ] **Step 4: Stabilize hero text contrast**

  Add one pointer-events-none local dark gradient over the video, concentrating contrast around the top navigation and left-center Chinese copy. Keep the existing composition and avoid adding a copy card.

### Task 2: 可打断能力弹层

**Files:**

- Modify: `apps/brand/src/brand/components/BrandNavigation.tsx`
- Modify: `apps/brand/src/styles.css`

**Interfaces:**

- Consumes: `BrandNavigationHandle.openCapability(area, trigger)`
- Produces: independent `activeArea: CapabilityArea | null` and `isPresented: boolean`

- [ ] **Step 1: Replace timer-driven close state**

  Remove `isClosing`, `closeTimerRef`, `window.setTimeout`, `data-closing`, disabled tab buttons, and dialog-wide input locking. `requestClose()` only targets `isPresented=false`; `openCapability()` and in-dialog tab switching always retarget `isPresented=true`.

- [ ] **Step 2: Keep native dialog lifecycle and focus behavior**

  On first active area, call `showModal()`, lock body scrolling, and focus the close button. On exit completion, close and clear only when `isPresented` is still false. Cleanup restores body overflow and returns focus to the last trigger.

- [ ] **Step 3: Implement interruptible Motion targets**

  Replace CSS keyframes with `motion.button` for the 0.18-second backdrop opacity and `motion.section` for panel opacity/full transform strings. Desktop targets `translateY(10px) scale(0.985)` ↔ `translateY(0) scale(1)` with `{ type: 'spring', bounce: 0, duration: 0.36 }`; reduced motion uses no transform and an immediate or short opacity change.

- [ ] **Step 4: Anchor desktop and bottom-align mobile**

  After `showModal()`, measure the last trigger and panel rectangles and set CSS custom properties for panel transform origin. Below 768px, override origin to bottom-center, align the panel at the safe-area bottom, cap its height, allow internal scrolling, and use `translateY(10%)` ↔ `translateY(0)` symmetrically.

- [ ] **Step 5: Keep content switching subtle**

  Key only the copy block by active area and retain a short opacity/maximum 4px entrance; do not reanimate the panel. Switching while closing must immediately retarget the existing panel to presented state.

### Task 3: Group 导航、节奏与静态反馈

**Files:**

- Modify: `apps/brand/src/brand/components/BrandNavigation.tsx`
- Modify: `apps/brand/src/pages/group/components/LeadershipStructure.tsx`
- Modify: `apps/brand/src/pages/group/components/LeagueBoard.tsx`
- Modify: `apps/brand/src/pages/group/components/GroupVision.tsx`
- Modify: `apps/brand/src/pages/group/components/SportsStructure.tsx`
- Modify: `apps/brand/src/styles.css`

**Interfaces:**

- Produces: Group desktop nav mapping `/digital`, `/content`, noninteractive film status, external sports link, current group state
- Preserves: compact mobile home + group navigation and existing group component props/data

- [ ] **Step 1: Make Group navigation sticky and semantically consistent**

  Use the existing translucent pill as sticky top chrome. On desktop render Digital and Content as internal links, Film as `影视，独立页面筹备中`, Sports as an external link labelled `体育，将在新窗口打开`, and Group with `aria-current="page"`. Keep mobile limited to the home link and current Group state.

- [ ] **Step 2: Tighten downstream section spacing**

  Change Leadership, LeagueBoard, and GroupVision containers from `py-24 md:py-32` to `py-16 md:py-24`. Keep SportsStructure at `py-16 md:py-24`.

- [ ] **Step 3: Remove false affordances and ambient loops**

  Delete hover lift/border enhancement from `.group-leader-card` and `.group-director-seat`. Remove the 18–22 second `group-orbit-breathe` animations and keyframes while preserving the existing one-time Framer Motion entry.

- [ ] **Step 4: Clarify sports external-link names**

  Change both sports entity card labels to `${entity.name}，进入高歌体育，将在新窗口打开` without changing destinations or visual external-link icons.

### Task 4: System preference fallbacks

**Files:**

- Modify: `apps/brand/src/brand/components/BrandNavigation.tsx`
- Modify: `apps/brand/src/styles.css`

**Interfaces:**

- Consumes: shared classes `brand-navigation-surface`, `brand-capability-panel`, `brand-capability-backdrop`
- Produces: media-query-only visual fallbacks; no JavaScript API

- [ ] **Step 1: Mark translucent navigation surfaces**

  Apply `brand-navigation-surface` to both Group and standard navigation materials so system preference rules can target them without changing component structure.

- [ ] **Step 2: Add reduced-transparency fallback**

  Under `@media (prefers-reduced-transparency: reduce)`, remove both standard and WebKit backdrop filters, use near-solid dark navigation/panel backgrounds, and retain visible borders.

- [ ] **Step 3: Add increased-contrast fallback**

  Under `@media (prefers-contrast: more)`, use near-solid surfaces, border contrast of at least `rgb(255 255 255 / 30%)`, stronger key navigation text, and 2px focus-visible outlines.

### Task 5: Unified tests, verification, and code review

**Files:**

- Modify: `apps/brand/src/App.test.tsx`
- Modify: `apps/brand/src/concepts/skiing/components/SkiingHero.test.tsx`

**Interfaces:**

- Verifies: all public behavior introduced by Tasks 1–4
- Preserves: existing Brand route, capability data, management, board, and group content assertions

- [ ] **Step 1: Update interaction coverage after implementation**

  Add assertions for Group nav targets/current state, explicit home group CTA, play/pause calls and labels, reduced-motion control omission, external sports labels, dialog open/switch/Escape/focus restore, and close-then-reopen retargeting without fake-timer dependency.

- [ ] **Step 2: Run Brand tests and static verification**

  Run:

  ```bash
  pnpm --filter @gaoge/app-brand test
  pnpm --filter @gaoge/app-brand typecheck
  pnpm --filter @gaoge/app-brand build
  pnpm exec eslint apps/brand/src
  pnpm exec stylelint "apps/brand/src/**/*.css"
  pnpm exec prettier --check apps/brand/src docs/superpowers/specs docs/superpowers/plans
  ```

  Expected: every command exits 0 with no new warnings.

- [ ] **Step 3: Review the final diff**

  Inspect `git diff --check`, scan for stale `isClosing`, timer, `data-closing`, `pointer-events: none`, orbit animation, accidental route/dependency/data changes, and confirm every changed file maps to this plan.

- [ ] **Step 4: Perform browser checks**

  Check `/` and `/group` at 1440×900, 390×844, and 320×800; exercise mouse and keyboard controls, dialog interruption/focus return, sticky navigation, bottom sheet, video toggle, and horizontal overflow. Also inspect reduced-motion, reduced-transparency, and increased-contrast fallbacks where browser emulation supports them.
