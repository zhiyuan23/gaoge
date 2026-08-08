# 高歌 Brand 导航与能力弹窗修订 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将首页与 Group 页统一为居中能力弹窗，精简首页集团入口，并让 Group 桌面导航以内容宽度的中等透明毛玻璃承载能力按钮。

**Architecture:** `BrandNavigation` 继续作为首页和 Group 页共享的导航与原生 `dialog` 容器，但移除媒体控制、移动端 Sheet 和触发源位置测量。`SkiingHero` 只负责视频自动播放，`SkiingNavbar` 恢复为无 props 包装；Group 桌面领域按钮直接调用同一 `openCapability` 状态流。

**Tech Stack:** React 19、TypeScript、React Router、Framer Motion、Tailwind CSS、原生 CSS、Vitest、Testing Library

## Global Constraints

- 本次执行不使用 TDD 和 subagent；先完成实现，再统一更新测试与验证。
- 不移除首页背景视频，不改变四个能力领域的标题、状态和说明文案。
- 不修改 `/digital`、`/content`、`/group` 路由和体育站点地址。
- 不给 Group 移动端增加四个领域按钮。
- 不新增依赖、context、全局状态或共享包抽象。
- 桌面和移动端弹窗都必须水平、垂直居中，并保留 Escape、焦点进入与焦点归还。
- Group 的 `overflow-x-clip` 必须保留，确保 sticky 导航相对视口生效。

---

### Task 1: 精简首页媒体与集团入口

**Files:**

- Modify: `apps/brand/src/concepts/skiing/components/SkiingHero.tsx`
- Modify: `apps/brand/src/concepts/skiing/components/SkiingNavbar.tsx`
- Modify: `apps/brand/src/brand/components/BrandNavigation.tsx`

**Interfaces:**

- Preserves: `BrandNavigationHandle.openCapability(area, trigger)`
- Removes: `BrandMediaControl`, `SkiingNavbarProps`, `isVideoPlaying`, `toggleVideo`
- Produces: `SkiingNavbar` as `forwardRef<BrandNavigationHandle>` with no props

- [x] **Step 1: Remove navigation media-control state and props**

  In `SkiingHero`, remove `useState`, playback state synchronization, `toggleVideo`, `onPlay`, and `onPause`. Keep the guarded autoplay path:

  ```tsx
  const tryPlayVideo = useCallback(async () => {
    const video = videoRef.current
    if (!video) return

    video.muted = true
    video.defaultMuted = true

    try {
      await video.play()
    } catch {
      // Autoplay failures remain silent; existing touch and WeChat retries stay active.
    }
  }, [])
  ```

  Restore `SkiingNavbar` to:

  ```tsx
  const SkiingNavbar = forwardRef<BrandNavigationHandle>(function SkiingNavbar(_, ref) {
    return <BrandNavigation ref={ref} current="home" overlay />
  })
  ```

- [x] **Step 2: Remove the pause/play control and update the group CTA**

  Delete `Pause`, `Play`, `BrandMediaControl`, the `mediaControl` prop, and the home control cluster. Render one link:

  ```tsx
  <Link aria-label="高歌集团" title="高歌集团" to="/group">
    <span className="whitespace-nowrap">高歌集团</span>
  </Link>
  ```

  Preserve the 44px height, glass material, press feedback, focus outline, and single-line behavior from 320px upward.

### Task 2: 统一居中且可外部关闭的能力弹窗

**Files:**

- Modify: `apps/brand/src/brand/components/BrandNavigation.tsx`
- Modify: `apps/brand/src/styles.css`

**Interfaces:**

- Consumes: `activeArea: CapabilityArea | null`, `isPresented: boolean`
- Preserves: native `dialog`, `requestClose()`, `finishClose()`, focus restoration
- Removes: `isMobile`, `panelRef`, `syncPanelOrigin()`, origin CSS custom properties

- [x] **Step 1: Remove responsive Sheet and trigger-origin state**

  Delete viewport width state, resize listeners, trigger/panel rectangle measurement, `requestAnimationFrame(syncPanelOrigin)`, and mobile transform branches. Keep `triggerRef` only for focus restoration.

- [x] **Step 2: Center the panel on every viewport**

  Use a single outer container:

  ```tsx
  <div
    className="relative mx-auto flex min-h-full max-w-2xl items-center justify-center"
    data-testid="capability-dismiss-area"
    onClick={requestClose}
  >
    <motion.section onClick={(event) => event.stopPropagation()}>
      {/* existing panel content */}
    </motion.section>
  </div>
  ```

  The panel uses `max-height: min(42rem, calc(100dvh - 2rem))` and `overflow-y: auto`; mobile keeps 16px side spacing through dialog padding.

- [x] **Step 3: Make the backdrop visual-only and keep all close paths**

  Replace the backdrop button with an `aria-hidden` `motion.div`. Escape and the close button still call `requestClose`; clicking the outer dismiss area closes, while clicking the panel or its controls does not.

- [x] **Step 4: Replace directional spring motion with centered modal motion**

  Animate the panel between these exact targets:

  ```tsx
  animate={{
    opacity: isPresented ? 1 : 0,
    transform: isPresented ? 'scale(1)' : reducedMotion ? 'scale(1)' : 'scale(0.96)',
  }}
  transition={
    reducedMotion
      ? { duration: 0.01 }
      : { duration: 0.25, ease: [0.23, 1, 0.32, 1] }
  }
  ```

  Keep backdrop opacity at 0.18 seconds and retain close-then-reopen retargeting through `isPresented`.

### Task 3: Group 桌面能力导航与毛玻璃材质

**Files:**

- Modify: `apps/brand/src/brand/components/BrandNavigation.tsx`
- Modify: `apps/brand/src/styles.css`
- Verify unchanged: `apps/brand/src/brand/components/BrandPageShell.tsx`

**Interfaces:**

- Produces: Group desktop capability buttons for `digital | content | film | sports`
- Preserves: mobile home + current Group navigation and `aria-current="page"`
- Reuses: `openCapability(area, event.currentTarget)`

- [x] **Step 1: Align Group navigation to theme content width**

  Change `max-w-[1440px]` to `max-w-7xl`; preserve sticky header positioning and `BrandPageShell`'s `overflow-x-clip`.

- [x] **Step 2: Convert Group desktop fields to dialog buttons**

  Render every area as:

  ```tsx
  <button
    aria-controls="brand-capability-dialog"
    aria-expanded={activeArea === area.key}
    aria-haspopup="dialog"
    onClick={(event) => openCapability(area.key, event.currentTarget)}
    type="button"
  >
    {area.label}
  </button>
  ```

  Remove Group desktop `NavLink`, external sports anchor, and film preparation state. Change dialog rendering from home-only to `current === 'home' || current === 'group'`.

- [x] **Step 3: Apply balanced Group glass material**

  Add `brand-group-navigation` and style it with:

  ```css
  .brand-group-navigation {
    background: rgb(10 10 12 / 55%);
    -webkit-backdrop-filter: blur(24px) saturate(130%);
    backdrop-filter: blur(24px) saturate(130%);
    border-color: rgb(255 255 255 / 15%);
  }
  ```

  Preserve the existing inner highlight and shadow. Keep the later reduced-transparency and increased-contrast media queries authoritative so they still remove blur and use near-solid backgrounds.

### Task 4: Unified tests and verification

**Files:**

- Modify: `apps/brand/src/App.test.tsx`
- Modify: `apps/brand/src/concepts/skiing/components/SkiingHero.test.tsx`

**Interfaces:**

- Verifies: public behavior from Tasks 1–3
- Preserves: route, Group data, management, board, and capability-copy assertions

- [x] **Step 1: Update tests after implementation**

  Update exact assertions to cover:

  ```tsx
  expect(screen.queryByRole('button', { name: '暂停背景视频' })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: '播放背景视频' })).not.toBeInTheDocument()
  expect(screen.getByRole('link', { name: '高歌集团' })).toHaveAttribute('href', '/group')
  expect(screen.getByRole('navigation', { name: '高歌品牌导航' })).toHaveClass('max-w-7xl')
  ```

  Add Group button tests for all four capability areas, verify there are no Group area links, open and close one Group capability dialog with focus restoration, click `capability-dismiss-area` to close, and click `capability-panel` to prove internal clicks do not close.

- [x] **Step 2: Run the complete Brand verification suite**

  Run:

  ```bash
  pnpm --filter @gaoge/app-brand test
  pnpm --filter @gaoge/app-brand typecheck
  pnpm --filter @gaoge/app-brand build
  pnpm exec eslint apps/brand/src
  pnpm exec stylelint "apps/brand/src/**/*.css"
  pnpm exec prettier --check apps/brand/src docs/superpowers/specs docs/superpowers/plans
  git diff --check
  ```

  Expected: every command exits 0, Brand reports zero failing tests, and no formatting or lint warnings are introduced.

- [x] **Step 3: Review implementation scope**

  Search for stale `BrandMediaControl`, `isVideoPlaying`, `toggleVideo`, `isMobile`, `syncPanelOrigin`, `brand-capability-origin`, bottom-alignment classes, Group area links, and pause/play icons. Confirm no route, dependency, data, API, sports app, or unrelated source changes.

- [x] **Step 4: Perform browser checks**

  Verify `/` and `/group` at 1440×900, 390×844, and 320×800. Check centered dialog geometry, all outside regions closing, internal clicks staying open, Group navigation/content width alignment, sticky behavior after scrolling, glass legibility, single-line “高歌集团”, horizontal overflow, focus restoration, and console warnings/errors.
