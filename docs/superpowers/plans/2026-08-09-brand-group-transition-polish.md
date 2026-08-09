# Brand Group Transition Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the visible flash between the homepage swipe animation and `/group`, then replace the large bottom pill with a restrained, responsive chevron indicator.

**Architecture:** Share one cached dynamic import between React lazy routing and a homepage preload effect so the destination module is ready before navigation. On homepage-originated navigation, render the same transition preview as a fixed first-frame handoff layer above the real group page, then fade and remove it after two animation frames. Keep the existing gesture physics and accessible button hit area while reducing the visible affordance to a device-adaptive chevron.

**Tech Stack:** React 18, React Router 6, TypeScript, Framer Motion, Tailwind CSS, authored CSS, Vitest, Testing Library, Vite.

## Global Constraints

- Do not change gesture distance, velocity, wheel accumulation, or rubber-band behavior.
- Do not change group page content, routing paths, API, permissions, deployment, or other applications.
- Do not add dependencies or global state.
- The route handoff layer must be non-interactive and absent for direct `/group` visits and reduced-motion users.
- Desktop shows an approximately 24×12px animated chevron inside an at-least 44×44px transparent hit area.
- Mobile portrait shows an approximately 18×9px static chevron; short coarse-pointer landscape hides and disables the bottom indicator.
- Preserve the right-side group link, keyboard activation, focus visibility, and the existing accessible name `上滑了解高歌集团`.

---

### Task 1: Shared Group Route Preload

**Files:**

- Create: `apps/brand/src/pages/group/loadGroupPage.ts`
- Modify: `apps/brand/src/App.tsx`
- Modify: `apps/brand/src/concepts/skiing/components/SkiingHero.tsx`
- Test: `apps/brand/src/concepts/skiing/components/SkiingHero.test.tsx`

**Interfaces:**

- Produces: `loadGroupPage(): Promise<{ default: ComponentType }>` for `React.lazy`.
- Produces: `preloadGroupPage(): void` for the homepage mount effect.
- Consumes: existing default export from `@/pages/group/GroupPage`.

- [ ] **Step 1: Write a failing preload test**

Add a hoisted mock and assertion to `SkiingHero.test.tsx`:

```tsx
const { preloadGroupPage } = vi.hoisted(() => ({
  preloadGroupPage: vi.fn(),
}))

vi.mock('@/pages/group/loadGroupPage', () => ({ preloadGroupPage }))

it('preloads the group route while the homepage is visible', () => {
  render(
    <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <SkiingHero />
    </MemoryRouter>,
  )

  expect(preloadGroupPage).toHaveBeenCalledTimes(1)
})
```

Clear the mock in the existing `beforeEach` or add one if required.

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
pnpm --filter @gaoge/app-brand test -- src/concepts/skiing/components/SkiingHero.test.tsx
```

Expected: FAIL because `@/pages/group/loadGroupPage` does not exist or the homepage never calls `preloadGroupPage`.

- [ ] **Step 3: Add the cached route loader**

Create `loadGroupPage.ts`:

```ts
import type { ComponentType } from 'react'

type GroupPageModule = { default: ComponentType }

let groupPagePromise: Promise<GroupPageModule> | null = null

export function loadGroupPage() {
  groupPagePromise ??= import('@/pages/group/GroupPage')
  return groupPagePromise
}

export function preloadGroupPage() {
  void loadGroupPage()
}
```

In `App.tsx`, replace the inline group dynamic import with the shared loader:

```tsx
import { loadGroupPage } from '@/pages/group/loadGroupPage'

const GroupPage = lazy(loadGroupPage)
```

In `SkiingHero.tsx`, preload without blocking rendering:

```tsx
import { preloadGroupPage } from '@/pages/group/loadGroupPage'

useEffect(() => {
  preloadGroupPage()
}, [])
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run the Task 1 focused test command again. Expected: the new preload test and all existing `SkiingHero` tests PASS.

- [ ] **Step 5: Commit the preload change**

```bash
git add apps/brand/src/App.tsx apps/brand/src/concepts/skiing/components/SkiingHero.tsx apps/brand/src/concepts/skiing/components/SkiingHero.test.tsx apps/brand/src/pages/group/loadGroupPage.ts
git commit -m "fix(brand): preload group route before transition"
```

---

### Task 2: First-Frame Route Handoff

**Files:**

- Create: `apps/brand/src/pages/group/components/GroupRouteHandoff.tsx`
- Create: `apps/brand/src/pages/group/components/GroupRouteHandoff.test.tsx`
- Modify: `apps/brand/src/pages/group/GroupPage.tsx`
- Modify: `apps/brand/src/App.test.tsx`
- Modify: `apps/brand/src/styles.css`

**Interfaces:**

- Consumes: `active: boolean` and the existing `GroupTransitionPreview` visual.
- Produces: a fixed `data-testid="group-route-handoff"` overlay when active and motion is allowed.
- Produces: `data-leaving="true"` after two animation frames; removes itself after its opacity transition ends.

- [ ] **Step 1: Write failing handoff lifecycle tests**

Create `GroupRouteHandoff.test.tsx` with a controllable animation-frame queue:

```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import GroupRouteHandoff from '@/pages/group/components/GroupRouteHandoff'

let reducedMotion = false
let frameCallbacks: FrameRequestCallback[] = []

vi.mock('framer-motion', async (importOriginal) => ({
  ...(await importOriginal<typeof import('framer-motion')>()),
  useReducedMotion: () => reducedMotion,
}))

describe('GroupRouteHandoff', () => {
  beforeEach(() => {
    reducedMotion = false
    frameCallbacks = []
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      frameCallbacks.push(callback)
      return frameCallbacks.length
    })
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined)
  })

  it('holds the transition preview for two frames before fading it out', () => {
    render(<GroupRouteHandoff active />)

    const handoff = screen.getByTestId('group-route-handoff')
    expect(handoff).toHaveAttribute('aria-hidden', 'true')
    expect(handoff).not.toHaveAttribute('data-leaving', 'true')

    frameCallbacks.shift()?.(0)
    expect(handoff).not.toHaveAttribute('data-leaving', 'true')
    frameCallbacks.shift()?.(16)
    expect(handoff).toHaveAttribute('data-leaving', 'true')

    fireEvent.transitionEnd(handoff, { propertyName: 'opacity' })
    expect(screen.queryByTestId('group-route-handoff')).not.toBeInTheDocument()
  })

  it('does not render for direct visits or reduced motion', () => {
    const direct = render(<GroupRouteHandoff active={false} />)
    expect(screen.queryByTestId('group-route-handoff')).not.toBeInTheDocument()
    direct.unmount()

    reducedMotion = true
    render(<GroupRouteHandoff active />)
    expect(screen.queryByTestId('group-route-handoff')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Add a failing route integration assertion**

Update the existing homepage-to-group route test in `App.test.tsx` so its `matchMedia` mock returns `false` for reduced motion. Immediately after `/group` is reached, expect the handoff overlay for the bottom button path:

```tsx
expect(screen.getByTestId('group-route-handoff')).toBeInTheDocument()
expect(screen.getByTestId('group-route-handoff')).toHaveClass('pointer-events-none', 'fixed')
```

Keep the top link scenario if it intentionally uses the same animated entry; direct `/group` tests must assert that no handoff is present.

- [ ] **Step 3: Run focused tests and verify RED**

Run:

```bash
pnpm --filter @gaoge/app-brand test -- src/pages/group/components/GroupRouteHandoff.test.tsx src/App.test.tsx
```

Expected: FAIL because `GroupRouteHandoff` and its route integration do not exist.

- [ ] **Step 4: Implement the handoff component**

Create `GroupRouteHandoff.tsx`:

```tsx
import { useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'

import GroupTransitionPreview from '@/concepts/skiing/components/GroupTransitionPreview'

interface GroupRouteHandoffProps {
  readonly active: boolean
}

export default function GroupRouteHandoff({ active }: GroupRouteHandoffProps) {
  const reducedMotion = useReducedMotion()
  const [leaving, setLeaving] = useState(false)
  const [mounted, setMounted] = useState(active && !reducedMotion)

  useEffect(() => {
    if (!active || reducedMotion) return

    let secondFrame = 0
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => setLeaving(true))
    })

    return () => {
      cancelAnimationFrame(firstFrame)
      if (secondFrame) cancelAnimationFrame(secondFrame)
    }
  }, [active, reducedMotion])

  if (!mounted || !active || reducedMotion) return null

  return (
    <div
      aria-hidden="true"
      className="group-route-handoff pointer-events-none fixed inset-0 z-[100]"
      data-leaving={leaving || undefined}
      data-testid="group-route-handoff"
      onTransitionEnd={(event) => {
        if (event.propertyName === 'opacity' && event.currentTarget === event.target) {
          setMounted(false)
        }
      }}
    >
      <GroupTransitionPreview />
    </div>
  )
}
```

The final implementation may initialize `mounted` from a helper to satisfy React state/lint rules, but must preserve synchronous first-render coverage.

- [ ] **Step 5: Integrate it into the group route**

In `GroupPage.tsx`, render the handoff as a sibling immediately before `BrandPageShell`:

```tsx
return (
  <>
    <GroupRouteHandoff active={fromHomeTransition} />
    <BrandPageShell current="group">
      <GroupHero industries={groupIndustries} skipEntranceAnimation={fromHomeTransition} />
      {/* existing sections unchanged */}
    </BrandPageShell>
  </>
)
```

Add the opacity-only style:

```css
.group-route-handoff {
  opacity: 1;
  transition: opacity 160ms cubic-bezier(0.23, 1, 0.32, 1);
}

.group-route-handoff[data-leaving='true'] {
  opacity: 0;
}
```

- [ ] **Step 6: Run focused tests and verify GREEN**

Run the Task 2 focused command again. Expected: lifecycle tests and route tests PASS with no React warnings.

- [ ] **Step 7: Commit the handoff fix**

```bash
git add apps/brand/src/App.test.tsx apps/brand/src/pages/group/GroupPage.tsx apps/brand/src/pages/group/components/GroupRouteHandoff.tsx apps/brand/src/pages/group/components/GroupRouteHandoff.test.tsx apps/brand/src/styles.css
git commit -m "fix(brand): smooth group route handoff"
```

---

### Task 3: Restrained Responsive Swipe Indicator

**Files:**

- Modify: `apps/brand/src/concepts/skiing/components/GroupSwipeEntry.tsx`
- Modify: `apps/brand/src/concepts/skiing/components/GroupSwipeEntry.test.tsx`
- Modify: `apps/brand/src/styles.css`

**Interfaces:**

- Preserves: button role and accessible name `上滑了解高歌集团`.
- Produces: `[data-testid="group-swipe-chevron"]` as the only visible child of the transparent 44×44px interaction target.
- Preserves: all existing click, pointer, wheel, disabled, reduced-motion, and duplicate-navigation behavior.

- [ ] **Step 1: Write the failing indicator structure test**

Replace the “visible button” expectation with explicit visual restraint assertions while retaining the click assertion:

```tsx
it('uses a compact chevron while preserving the accessible button and click action', async () => {
  const { onComplete } = renderEntry()
  const entry = screen.getByRole('button', { name: '上滑了解高歌集团' })

  expect(screen.getByTestId('group-swipe-chevron')).toBeInTheDocument()
  expect(entry).toHaveTextContent('')
  expect(entry).toHaveClass('min-h-11', 'min-w-11')

  fireEvent.click(entry)
  await vi.waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1))
})
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
pnpm --filter @gaoge/app-brand test -- src/concepts/skiing/components/GroupSwipeEntry.test.tsx
```

Expected: FAIL because the existing button has visible copy and no chevron test id.

- [ ] **Step 3: Replace the visible pill content**

Keep all handlers and `aria-label` unchanged, but replace the button classes and children:

```tsx
<button
  aria-label="上滑了解高歌集团"
  className="group-swipe-entry absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-[15] flex min-h-11 min-w-11 -translate-x-1/2 touch-none items-center justify-center text-white/55"
  disabled={disabled}
  onClick={handleClick}
  onPointerCancel={(event) => finishPointer(event, true)}
  onPointerDown={handlePointerDown}
  onPointerMove={handlePointerMove}
  onPointerUp={finishPointer}
  type="button"
>
  <span aria-hidden="true" className="group-swipe-chevron" data-testid="group-swipe-chevron">
    <span />
    <span />
  </span>
</button>
```

Do not introduce visible copy or a second interactive element.

- [ ] **Step 4: Implement restrained CSS and responsive behavior**

Replace the old glass-pill styles with transparent hit-area and chevron styles:

```css
.group-swipe-entry {
  cursor: ns-resize;
  transition: color 150ms cubic-bezier(0.23, 1, 0.32, 1);
}

.group-swipe-chevron {
  position: relative;
  display: block;
  width: 1.5rem;
  height: 0.75rem;
  animation: none;
}

.group-swipe-chevron > span {
  position: absolute;
  top: 0.3rem;
  width: 0.9rem;
  height: 1px;
  background: currentcolor;
}

.group-swipe-chevron > span:first-child {
  left: 0;
  transform: rotate(-28deg);
  transform-origin: right center;
}

.group-swipe-chevron > span:last-child {
  right: 0;
  transform: rotate(28deg);
  transform-origin: left center;
}

@keyframes group-swipe-hint {
  0%,
  30%,
  100% {
    transform: translateY(0);
    opacity: 0.62;
  }
  14% {
    transform: translateY(-3px);
    opacity: 1;
  }
}

@media (hover: hover) and (pointer: fine) {
  .group-swipe-chevron {
    animation: group-swipe-hint 2s cubic-bezier(0.23, 1, 0.32, 1) infinite;
  }
}
```

Under `width < 768px`, shrink the visible chevron to approximately 18×9px while retaining the 44px button. Under the existing short coarse-pointer landscape query, set `.group-swipe-entry { display: none; }`. Under `prefers-reduced-motion: reduce`, force `animation: none`.

Keep disabled, hover and focus-visible contrast legible without background, border, shadow, or backdrop filter.

- [ ] **Step 5: Run focused and route tests and verify GREEN**

Run:

```bash
pnpm --filter @gaoge/app-brand test -- src/concepts/skiing/components/GroupSwipeEntry.test.tsx src/App.test.tsx
```

Expected: all indicator interaction and route integration tests PASS.

- [ ] **Step 6: Commit the indicator polish**

```bash
git add apps/brand/src/concepts/skiing/components/GroupSwipeEntry.tsx apps/brand/src/concepts/skiing/components/GroupSwipeEntry.test.tsx apps/brand/src/styles.css
git commit -m "style(brand): refine group swipe indicator"
```

---

### Task 4: Browser QA and Full Verification

**Files:**

- Modify only if an observed issue requires a scoped correction in files already listed above.

**Interfaces:**

- Consumes: the complete preload, handoff, and responsive indicator behavior from Tasks 1–3.
- Produces: fresh automated and browser evidence that the original flash and visual-weight issues are resolved.

- [ ] **Step 1: Run all automated quality gates**

```bash
pnpm exec prettier --check apps/brand/src docs/superpowers/specs/2026-08-09-brand-group-transition-polish-design.md docs/superpowers/plans/2026-08-09-brand-group-transition-polish.md
pnpm exec eslint apps/brand/src
pnpm exec stylelint "apps/brand/src/**/*.css"
pnpm --filter @gaoge/app-brand typecheck
pnpm --filter @gaoge/app-brand test
pnpm --filter @gaoge/app-brand build
git diff --check
```

Expected: every command exits 0; Vitest reports zero failures; the production build completes.

- [ ] **Step 2: Inspect the transition under normal and throttled loading**

Run `pnpm dev:brand`, open the homepage, and check:

1. Drag or wheel to the group page at 1440×900.
2. Repeat with network throttling and cache disabled after the homepage itself loads.
3. Record the frame around URL change and confirm no `LOADING GAOGE`, black frame, brightness jump, or content displacement appears.
4. Confirm the handoff overlay becomes non-interactive immediately and is removed after its fade.
5. Confirm direct `/group`, refresh, back, and forward do not leave a stale overlay.

- [ ] **Step 3: Inspect responsive indicator behavior**

Check:

- 1440×900: visible 24px chevron, quiet animation, 44px hit area, no pill surface.
- 390×844 and 320×800: smaller static chevron, no overlap with DIGITAL/CONTENT or safe area, no horizontal overflow.
- 844×390 coarse-pointer landscape: no bottom indicator and no invisible click trap; right-side group link remains available.
- Keyboard: focus ring remains visible and Enter/Space activates the hidden-text button.
- Reduced motion: no full-screen slide, handoff overlay, or chevron animation.

- [ ] **Step 4: Review changed paths against the knowledge base**

Call `impact_for_changes` for every changed `apps/brand` path. Treat current source as primary because the repository context currently resolves through a fallback and reports no source map. Record whether a `kb-maintainer` rescan is warranted; do not write canonical knowledge during this task.

- [ ] **Step 5: Inspect final repository state**

```bash
git status --short
git log -6 --oneline
```

Expected: only intentionally ignored/user-owned files remain untracked; all implementation commits are present on the current branch. Do not push without explicit user authorization.
