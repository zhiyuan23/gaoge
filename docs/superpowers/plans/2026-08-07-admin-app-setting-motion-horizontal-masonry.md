# Admin App Setting Motion and Horizontal Masonry Implementation Plan

> **Status: Not implemented.** Do not treat the steps below as behavior present in the current implemented baseline or synchronized target worktrees.

> **Execution prerequisite:** Recheck the current `AppSetting/index.vue` baseline before using this historical plan. File line numbers and Git-state instructions were written before the current implementation was committed; the durable requirements are the motion, ordering, lifecycle, and verification contracts below.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the application settings modal fade without transform motion and display its PC panels in a compact, horizontally seeded two-column masonry layout while preserving mobile and configuration behavior.

**Architecture:** Keep all implementation local to `AppSetting/index.vue`. Override only this `FaModal` instance's animation variables through utility classes, then use a two-column CSS Grid plus a component-local `ResizeObserver` to convert each rendered panel height into an implicit grid-row span; mobile remains a normal single column and the observer is active only while the modal is open on PC.

**Tech Stack:** Vue 3 Composition API, TypeScript, Radix Vue dialog state attributes, UnoCSS animation utilities, CSS Grid, ResizeObserver, pnpm

## Global Constraints

- Only modify `apps/admin/src/layouts/components/AppSetting/index.vue` for implementation.
- Preserve every existing configuration field, store binding, visibility rule, disabled state, tooltip, footer action, and copy interaction.
- Keep the animation override local to AppSetting; do not modify `FaModal`, `DialogContent`, or another modal consumer.
- Keep the shared 200 ms open and close duration and the overlay's existing fade behavior.
- Keep the seven panels in their current DOM order.
- PC uses two equal-width columns with 16 px horizontal and vertical gaps; mobile remains one normal vertical column with 16 px gaps.
- Add no dependency, shared component API, reusable layout abstraction, store field, type contract, route, or theme token.
- Preserve any unrelated worktree changes in `AppSetting/index.vue` and elsewhere.
- Do not commit until implementation and visual verification are complete; follow the user's integration choice after verification.

---

### Task 1: Make AppSetting Use Fade-only Motion

**Files:**

- Modify: `apps/admin/src/layouts/components/AppSetting/index.vue:90-97`
- Verify: `apps/admin/src/ui/components/FaModal/dialog/DialogContent.vue:56-76`

**Interfaces:**

- Consumes: `FaModal.class`, the shared `data-[state=open|closed]` attributes, and `unocss-preset-animations` transform variables.
- Produces: local animation overrides for AppSetting with scale fixed at `1` and vertical translation fixed at `0`.

- [ ] **Step 1: Capture the focused baseline**

Run:

```bash
git diff -- apps/admin/src/layouts/components/AppSetting/index.vue
```

Expected: record the current AppSetting status and focused diff, then confirm the baseline contains `FaModal`, seven panels, compact controls, the footer notice, `singleMenuHideFirstLevel`, and `menuModeSwitch`. If the file is already dirty, preserve and classify those changes before editing.

- [ ] **Step 2: Add local transform-neutral animation utilities**

Change the AppSetting `FaModal` class from:

```vue
class="sm:max-w-4xl"
```

to:

```vue
class="data-[state=closed]:zoom-out-100 data-[state=open]:zoom-in-100
data-[state=closed]:slide-out-to-top-0 data-[state=open]:slide-in-from-top-0 sm:max-w-4xl"
```

The later instance classes override the shared `zoom-*-95` and `slide-*-top-1/5` utilities through the existing `cn()` class merge. Keep the shared `animate-in`, `animate-out`, `fade-in-0`, `fade-out-0`, and `duration-200` classes untouched.

- [ ] **Step 3: Format and inspect the focused change**

Run:

```bash
pnpm exec prettier --write apps/admin/src/layouts/components/AppSetting/index.vue
git diff --check
git diff -- apps/admin/src/layouts/components/AppSetting/index.vue
```

Expected: AppSetting has four transform-neutral state classes and no shared modal file changed.

---

### Task 2: Replace Vertical Columns with Responsive Horizontal Masonry

**Files:**

- Modify: `apps/admin/src/layouts/components/AppSetting/index.vue:18-38,89-462,486-590`

**Interfaces:**

- Consumes: `isShow: Ref<boolean>`, `settingsStore.mode`, `requestAnimationFrame`, `ResizeObserver`, and direct `.setting-panel` children of `settingPanelGridRef`.
- Produces: `isMasonryReady: Ref<boolean>`, `settingPanelGridRef: Readonly<ShallowRef<HTMLElement | null>>`, and local lifecycle functions `clearMasonryLayout()`, `updateMasonryPanelSpan(panel)`, `setupMasonryLayout()`, and `scheduleMasonryLayout()`.

- [ ] **Step 1: Add masonry constants, refs, and observer state**

Immediately after `const isShow = ref(false)`, add:

```ts
const MASONRY_ROW_HEIGHT = 8
const MASONRY_GAP = 16

const settingPanelGridRef = useTemplateRef<HTMLElement>('settingPanelGridRef')
const isMasonryReady = ref(false)

let panelResizeObserver: ResizeObserver | undefined
let masonryFrameId: number | undefined
```

These values match the planned 8 px implicit row track and 16 px visual gap.

- [ ] **Step 2: Add observer cleanup and row-span calculation**

Before the existing menu-mode watcher, add:

```ts
function getSettingPanels() {
  return settingPanelGridRef.value
    ? Array.from(settingPanelGridRef.value.querySelectorAll<HTMLElement>(':scope > .setting-panel'))
    : []
}

function clearMasonryLayout() {
  if (masonryFrameId !== undefined) {
    cancelAnimationFrame(masonryFrameId)
    masonryFrameId = undefined
  }
  panelResizeObserver?.disconnect()
  panelResizeObserver = undefined
  getSettingPanels().forEach((panel) => panel.style.removeProperty('grid-row-end'))
  isMasonryReady.value = false
}

function updateMasonryPanelSpan(panel: HTMLElement) {
  const span = Math.ceil(
    (panel.getBoundingClientRect().height + MASONRY_GAP) / (MASONRY_ROW_HEIGHT + MASONRY_GAP),
  )
  const gridRowEnd = `span ${span}`
  if (panel.style.gridRowEnd !== gridRowEnd) {
    panel.style.gridRowEnd = gridRowEnd
  }
}
```

Expected: cleanup is idempotent, the span formula accounts for both track height and the gap embedded between spanned tracks, and unchanged measurements do not trigger redundant layout writes.

- [ ] **Step 3: Add masonry setup and scheduling**

Continue with:

```ts
function setupMasonryLayout() {
  clearMasonryLayout()
  if (
    settingsStore.mode !== 'pc' ||
    !settingPanelGridRef.value ||
    typeof ResizeObserver === 'undefined'
  ) {
    return
  }

  const panels = getSettingPanels()
  panels.forEach(updateMasonryPanelSpan)
  isMasonryReady.value = true

  panelResizeObserver = new ResizeObserver((entries) => {
    entries.forEach((entry) => updateMasonryPanelSpan(entry.target as HTMLElement))
  })
  panels.forEach((panel) => panelResizeObserver?.observe(panel))
}

function scheduleMasonryLayout() {
  if (masonryFrameId !== undefined) {
    cancelAnimationFrame(masonryFrameId)
  }
  masonryFrameId = requestAnimationFrame(() => {
    masonryFrameId = undefined
    setupMasonryLayout()
  })
}
```

Apply spans before enabling the masonry-ready class so the baseline two-column Grid remains stable while initial measurements are taken.

- [ ] **Step 4: Connect the observer to modal and device-mode lifecycle**

Add these watchers before the existing menu-mode watcher:

```ts
watch(isShow, async (visible) => {
  if (!visible) {
    clearMasonryLayout()
    return
  }
  await nextTick()
  scheduleMasonryLayout()
})

watch(
  () => settingsStore.mode,
  async () => {
    if (!isShow.value) {
      return
    }
    await nextTick()
    scheduleMasonryLayout()
  },
)

onUnmounted(clearMasonryLayout)
```

Expected: closed and unmounted states retain no observer or animation frame; reopening and PC/mobile changes remeasure from current rendered content.

- [ ] **Step 5: Replace the multi-column container classes**

Replace:

```vue
<div
  class="gap-4"
  :class="{
    'columns-1': settingsStore.mode === 'mobile',
    'columns-2': settingsStore.mode === 'pc',
  }"
>
```

with:

```vue
<div
  ref="settingPanelGridRef"
  class="setting-panel-grid"
  :class="{
    'is-mobile': settingsStore.mode === 'mobile',
    'is-masonry-ready': isMasonryReady,
  }"
>
```

Expected: the template exposes one grid element to the script and no longer uses CSS multi-column flow.

- [ ] **Step 6: Mark all seven direct panel children and remove obsolete spacing**

For `导航菜单`, `顶栏`, `标签栏`, `工具栏`, `主题`, `页面`, and `应用`, replace:

```vue
class="bg-secondary m-0 mb-4 break-inside-avoid"
```

with:

```vue
class="setting-panel bg-secondary m-0"
```

Run:

```bash
rg -n 'class="setting-panel bg-secondary m-0"' apps/admin/src/layouts/components/AppSetting/index.vue
```

Expected: exactly seven matches; panel order and content are unchanged.

- [ ] **Step 7: Add baseline, masonry-ready, and mobile layout styles**

At the start of the existing scoped style block, before `.menu-mode`, add:

```css
.setting-panel-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;

  &.is-masonry-ready {
    grid-auto-flow: dense;
    grid-auto-rows: 8px;
  }

  &.is-mobile {
    display: flex;
    flex-direction: column;
  }

  .setting-panel {
    align-self: start;
  }
}
```

The baseline is a usable two-column Grid when `ResizeObserver` is unavailable. `align-self: start` prevents grid-area stretching from feeding a larger height back into the observer.

- [ ] **Step 8: Format and verify the focused layout source**

Run:

```bash
pnpm exec prettier --write apps/admin/src/layouts/components/AppSetting/index.vue
pnpm exec eslint apps/admin/src/layouts/components/AppSetting/index.vue
pnpm exec stylelint "apps/admin/src/layouts/components/AppSetting/index.vue"
git diff --check
```

Expected: all commands exit `0`; no field binding, panel title, footer text, or other file changes as part of this task.

---

### Task 3: Verify Motion, Masonry Lifecycle, and Preserved Behavior

**Files:**

- Verify: `apps/admin/src/layouts/components/AppSetting/index.vue`
- Verify unchanged: `apps/admin/src/ui/components/FaModal/dialog/DialogContent.vue`

**Interfaces:**

- Consumes: completed Tasks 1 and 2.
- Produces: verified AppSetting behavior with no new public API or dependency.

- [ ] **Step 1: Verify every existing configuration binding remains present**

Run:

```bash
rg -n "app\.colorScheme|app\.radius|menu\.mode|mainMenuClickMode|singleMenuHideFirstLevel|subMenuUniqueOpened|subMenuCollapse|enableSubMenuCollapseButton|menu\.enableHotkeys|topbar\.mode|tabbar\.enable|tabbar\.enableIcon|tabbar\.enableHotkeys|toolbar\.breadcrumb|toolbar\.menuModeSwitch|toolbar\.navSearch|toolbar\.fullscreen|toolbar\.pageReload|toolbar\.colorScheme|mainPage\.enableHotkeys|navSearch\.enableHotkeys|copyright\.|home\.enable|home\.title|enablePermission|enableProgress|enableMournMode|enableColorAmblyopiaMode|enableDynamicTitle" apps/admin/src/layouts/components/AppSetting/index.vue
```

Expected: every listed binding remains present, including `singleMenuHideFirstLevel`.

- [ ] **Step 2: Run Admin typecheck**

Run:

```bash
pnpm --filter @gaoge/app-admin typecheck
```

Expected: exit `0` with no Vue or TypeScript errors.

- [ ] **Step 3: Run the Admin production build**

Run:

```bash
pnpm --filter @gaoge/app-admin build
```

Expected: exit `0` and a completed Vite production build.

- [ ] **Step 4: Perform browser motion and desktop masonry checks**

Run the Admin development server and open the existing application at `http://127.0.0.1:9000/`. Verify:

1. AppSetting opens and closes with opacity change only; its scale and position remain constant.
2. Another representative `FaModal` still uses the shared fade, zoom, and slight vertical motion.
3. PC displays two equal-width columns with 16 px gaps and no overlaps.
4. Initial placement begins with `导航菜单` on the left and `顶栏` on the right, then densely fills the earliest available vertical space in DOM order.
5. Toggling settings that change panel content height and resizing the viewport produces no stale overlap or clipped panel.
6. Closing and reopening recalculates the current layout without retaining a stale observer result.

Expected: all six checks pass and the browser console contains no new warning or error from observer loops.

- [ ] **Step 5: Perform mobile, theme, footer, and copy checks**

Verify at a mobile viewport:

1. Panels render in one vertical column in DOM order with 16 px gaps and no horizontal overflow.
2. Light and dark themes retain readable panel headers, bodies, borders, and controls.
3. All seven panels and existing conditional controls remain available.
4. The footer notice stays outside the scroll body.
5. `复制配置` still copies the diff, updates its icon, and shows the existing success toast.

Expected: all five checks pass.

- [ ] **Step 6: Review knowledge impact and final diff**

Call knowledge-base `impact_for_changes` with:

```text
repo: gaoge
paths:
  - apps/admin/src/layouts/components/AppSetting/index.vue
```

Then run:

```bash
git diff --check
git status --short
git diff --stat
git diff -- apps/admin/src/layouts/components/AppSetting/index.vue
```

Expected: implementation changes remain local to AppSetting, pre-existing unrelated worktree changes remain intact, and no implementation change is staged or committed.
