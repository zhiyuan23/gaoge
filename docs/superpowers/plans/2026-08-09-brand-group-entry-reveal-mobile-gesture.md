# Brand Group Single Entry Reveal and Mobile Gesture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the persisted Group foreground reveal exactly once after route activation on desktop and mobile, while making mobile upward swipes responsive from the homepage's noninteractive surface without changing desktop motion or direct `/group` loading isolation.

**Architecture:** Keep the existing persistent two-layer route scene and add an explicit `direct | staged | active` presentation attribute to the real Group page. CSS hides only the staged navigation, hero copy, and orbit, then reveals those same nodes after activation; gesture physics receive an explicit desktop/mobile profile, while `GroupSwipeEntry` owns pointer tracking at the viewport and rejects interactive targets.

**Tech Stack:** React 18, TypeScript, React Router 6, Framer Motion 12, Tailwind CSS 3, CSS, Vitest, Testing Library, Vite

## Global Constraints

- Keep one real Group DOM tree; do not add preview or handoff markup and do not change keys during `staged -> active`.
- The staged Group background remains visible; only navigation, hero copy, and industry orbit are hidden.
- Use `opacity: 0` plus `translate3d(0, 8px, 0)` for staged foreground.
- Use `240ms` for navigation/copy, `280ms` for the orbit, at most `40ms` orbit delay, and `cubic-bezier(0.16, 1, 0.3, 1)`.
- Direct `/group` keeps the existing Framer Motion entrance and must not load the homepage video, poster, or `SkiingPage` module.
- Mobile gesture profile: `8px` start threshold, `18%` distance commit, `5%` flick minimum distance, `650px/s` minimum upward velocity, `16%` projection.
- Desktop gesture profile remains `10px`, `28%`, `8%`, `900px/s`, and `16%` projection; desktop wheel behavior is unchanged.
- Coarse-pointer viewport capture must ignore links, buttons other than the Group swipe button, dialogs, form controls, editable content, and `[data-group-transition-ignore]`.
- Do not add dependencies or change Group content, page ordering, routes, downward-return behavior, or homepage loading strategy.
- Under `prefers-reduced-motion: reduce`, staged foreground stays hidden and active foreground appears immediately without a transition.

---

## File Structure

- `apps/brand/src/brand/components/HomeGroupRouteShell.tsx`: derives `staged`/`active` for persisted sessions and preserves `direct` visits.
- `apps/brand/src/brand/components/HomeGroupRouteShell.test.tsx`: proves the persisted node survives the presentation state change and direct visits stay isolated.
- `apps/brand/src/brand/components/BrandPageShell.tsx`: writes the Group presentation attribute and stable navigation reveal class on the Group root.
- `apps/brand/src/brand/components/BrandNavigation.tsx`: accepts the stable reveal class on the Group header without changing navigation behavior.
- `apps/brand/src/pages/group/GroupPage.tsx`: owns the public `GroupEntryPresentation` interface and derives metadata/Framer behavior from it.
- `apps/brand/src/pages/group/GroupPage.test.tsx`: verifies first-commit state, metadata ownership, and foreground/background class boundaries.
- `apps/brand/src/pages/group/components/GroupHero.tsx`: marks the hero copy and orbit as the two CSS reveal units without changing direct Framer animation.
- `apps/brand/src/pages/group/components/GroupHero.test.tsx`: verifies stable reveal classes and skipped Framer initial state for persisted sessions.
- `apps/brand/src/concepts/skiing/groupTransition.ts`: provides immutable desktop/mobile gesture profiles and profile-aware intent evaluation.
- `apps/brand/src/concepts/skiing/groupTransition.test.ts`: locks exact desktop/mobile distance, velocity, and projection behavior.
- `apps/brand/src/concepts/skiing/components/GroupSwipeEntry.tsx`: moves pointer ownership to the viewport, selects a profile once per pointer, and filters interactive starts.
- `apps/brand/src/concepts/skiing/components/GroupSwipeEntry.test.tsx`: covers full-surface mobile drag, interaction exclusions, capture, cancellation, and desktop preservation.
- `apps/brand/src/styles.css`: adds staged/active foreground transitions and coarse-pointer `touch-action` without changing the desktop scene.
- `apps/brand/src/App.test.tsx`: keeps route-level loading isolation and adds a mobile surface-swipe integration assertion.

---

### Task 1: Persisted Group Foreground Reveals Once

**Files:**

- Modify: `apps/brand/src/brand/components/HomeGroupRouteShell.tsx:13-77`
- Modify: `apps/brand/src/brand/components/HomeGroupRouteShell.test.tsx:18-122`
- Modify: `apps/brand/src/brand/components/BrandPageShell.tsx:6-31`
- Modify: `apps/brand/src/brand/components/BrandNavigation.tsx:15-145`
- Modify: `apps/brand/src/pages/group/GroupPage.tsx:18-43`
- Modify: `apps/brand/src/pages/group/GroupPage.test.tsx:7-31`
- Modify: `apps/brand/src/pages/group/components/GroupHero.tsx:28-57`
- Modify: `apps/brand/src/pages/group/components/GroupHero.test.tsx:1-17`
- Modify: `apps/brand/src/styles.css:567-577,682-710`

**Interfaces:**

- Produces: `export type GroupEntryPresentation = 'active' | 'direct' | 'staged'` from `GroupPage.tsx`.
- Produces: `GroupPage({ entryPresentation?: GroupEntryPresentation })`, defaulting to `direct`.
- Produces: `BrandPageShell` optional `entryPresentation?: 'active' | 'direct' | 'staged'`, rendered as `data-entry-presentation` only for Group.
- Produces: `.group-entry-navigation`, `.group-entry-copy`, and `.group-entry-orbit` reveal hooks.
- Consumes: existing `GroupHero({ skipEntranceAnimation })`, metadata hook, persistent shell, and real Group DOM.

- [ ] **Step 1: Replace staging-prop tests with explicit presentation-state tests**

Update `GroupPage.test.tsx` so the staged render asserts the state on the first render, the three foreground hooks, and the unhidden architecture background:

```tsx
function renderGroup(entryPresentation: 'active' | 'direct' | 'staged' = 'direct') {
  return render(
    <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <GroupPage entryPresentation={entryPresentation} />
    </MemoryRouter>,
  )
}

it('commits the staged foreground hidden state with the real background intact', () => {
  document.title = '高歌首页'
  renderGroup('staged')

  const page = screen.getByRole('main')
  const background = screen.getByRole('img', { name: '深色金属与绿玻璃构成的弧形建筑结构' })

  expect(page).toHaveAttribute('data-entry-presentation', 'staged')
  expect(page.querySelector('.group-entry-navigation')).toBeInTheDocument()
  expect(page.querySelector('.group-entry-copy')).toBeInTheDocument()
  expect(page.querySelector('.group-entry-orbit')).toBeInTheDocument()
  expect(background).not.toHaveClass(
    'group-entry-navigation',
    'group-entry-copy',
    'group-entry-orbit',
  )
  expect(document.title).toBe('高歌首页')
})

it('owns metadata when active or direct', () => {
  const { rerender } = renderGroup('active')
  expect(document.title).toBe('高歌集团 - 让热爱持续生长')

  rerender(
    <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <GroupPage entryPresentation="direct" />
    </MemoryRouter>,
  )
  expect(screen.getByRole('main')).toHaveAttribute('data-entry-presentation', 'direct')
})
```

Update `GroupHero.test.tsx` to assert `.group-entry-copy` and `.group-entry-orbit`, and keep the existing assertion that `skipEntranceAnimation` produces no initial opacity/transform.

- [ ] **Step 2: Run the focused Group tests and verify they fail**

Run:

```bash
pnpm --filter @gaoge/app-brand test -- src/pages/group/GroupPage.test.tsx src/pages/group/components/GroupHero.test.tsx
```

Expected: FAIL because `entryPresentation`, `data-entry-presentation`, and the three reveal classes do not exist.

- [ ] **Step 3: Add the presentation interface and stable foreground hooks**

In `GroupPage.tsx`, replace the two booleans with the single state:

```tsx
export type GroupEntryPresentation = 'active' | 'direct' | 'staged'

interface GroupPageProps {
  readonly entryPresentation?: GroupEntryPresentation
}

export default function GroupPage({ entryPresentation = 'direct' }: GroupPageProps) {
  const isPersistedEntry = entryPresentation !== 'direct'

  useBrandMetadata({
    description:
      '认识高歌集团和数字、内容、影视、体育四个事业部，看见我们如何从热爱出发，让想法持续生长。',
    enabled: entryPresentation !== 'staged',
    title: '高歌集团 - 让热爱持续生长',
  })

  return (
    <BrandPageShell current="group" entryPresentation={entryPresentation}>
      <GroupHero industries={groupIndustries} skipEntranceAnimation={isPersistedEntry} />
      <DigitalStructure products={groupDigitalProducts} />
      <SportsStructure entities={sportsEntities} />
      <LeadershipStructure leaders={groupLeaders} />
      <LeagueBoard directors={leagueDirectors} />
      <GroupVision items={groupVisionItems} />
    </BrandPageShell>
  )
}
```

In `BrandPageShell.tsx`, accept `entryPresentation`, set `data-entry-presentation={current === 'group' ? entryPresentation : undefined}` on `<main>`, and pass `className={current === 'group' ? 'group-entry-navigation' : undefined}` to `BrandNavigation`. Extend `BrandNavigationProps` with `readonly className?: string` and append it to the Group `<header>` class so the entire navigation surface is one reveal unit.

In `GroupHero.tsx`, keep both `motion.div` elements and add only stable classes:

```tsx
className = 'group-entry-copy relative z-10 max-w-xl pb-10 pt-8 lg:pb-0'
className = 'group-entry-orbit relative z-10 min-w-0'
```

Apply the first value to the copy `motion.div` and the second to the `IndustryOrbit` wrapper; leave their current `animate`, `initial`, `transition`, and child markup unchanged.

- [ ] **Step 4: Make the route shell derive staged/active without remounting**

Update the persisted `GroupPage` render in `HomeGroupRouteShell.tsx`:

```tsx
<GroupPage entryPresentation={mode === 'group' ? 'active' : 'staged'} />
```

Keep the direct-session branch as `<GroupPage />`, which defaults to `direct`. Update the mock in `HomeGroupRouteShell.test.tsx` to render `data-entry-presentation` and drive metadata from the new state:

```tsx
default: ({ entryPresentation = 'direct' }: { entryPresentation?: string }) => {
  if (entryPresentation !== 'staged') document.title = '高歌集团 - 让热爱持续生长'
  return (
    <main data-entry-presentation={entryPresentation} data-testid="persistent-group-node">
      集团页
    </main>
  )
}
```

In the persistence test, store `const stagedGroup = await screen.findByTestId('persistent-group-node')`, assert it is `staged`, complete the transition, assert `screen.getByTestId('persistent-group-node') === stagedGroup`, then assert it is `active`. In the direct visit test assert `direct` and retain the existing `SkiingPage`/video isolation checks.

- [ ] **Step 5: Add staged-to-active CSS with reduced-motion behavior**

Add to `styles.css` next to `.brand-group-navigation`:

```css
.brand-matrix-page[data-entry-presentation='staged']
  :is(.group-entry-navigation, .group-entry-copy, .group-entry-orbit) {
  opacity: 0;
  transform: translate3d(0, 8px, 0);
}

.brand-matrix-page[data-entry-presentation='active']
  :is(.group-entry-navigation, .group-entry-copy, .group-entry-orbit) {
  opacity: 1;
  transform: translate3d(0, 0, 0);
}

.brand-matrix-page[data-entry-presentation]:not([data-entry-presentation='direct'])
  :is(.group-entry-navigation, .group-entry-copy) {
  transition:
    opacity 240ms cubic-bezier(0.16, 1, 0.3, 1),
    transform 240ms cubic-bezier(0.16, 1, 0.3, 1);
}

.brand-matrix-page[data-entry-presentation]:not([data-entry-presentation='direct'])
  .group-entry-orbit {
  transition:
    opacity 280ms cubic-bezier(0.16, 1, 0.3, 1) 40ms,
    transform 280ms cubic-bezier(0.16, 1, 0.3, 1) 40ms;
}
```

Inside the existing `@media (prefers-reduced-motion: reduce)` block, make active foreground immediate while retaining staged invisibility:

```css
.brand-matrix-page[data-entry-presentation='active']
  :is(.group-entry-navigation, .group-entry-copy, .group-entry-orbit) {
  transition: none !important;
}
```

- [ ] **Step 6: Run focused tests and style checks**

Run:

```bash
pnpm --filter @gaoge/app-brand test -- src/brand/components/HomeGroupRouteShell.test.tsx src/pages/group/GroupPage.test.tsx src/pages/group/components/GroupHero.test.tsx
pnpm exec stylelint apps/brand/src/styles.css
pnpm --filter @gaoge/app-brand typecheck
```

Expected: all commands PASS; the route-shell test proves the same node changes `staged -> active`, and direct `/group` still excludes the homepage module.

- [ ] **Step 7: Commit the single-entry reveal**

```bash
git add apps/brand/src/brand/components/HomeGroupRouteShell.tsx apps/brand/src/brand/components/HomeGroupRouteShell.test.tsx apps/brand/src/brand/components/BrandPageShell.tsx apps/brand/src/brand/components/BrandNavigation.tsx apps/brand/src/pages/group/GroupPage.tsx apps/brand/src/pages/group/GroupPage.test.tsx apps/brand/src/pages/group/components/GroupHero.tsx apps/brand/src/pages/group/components/GroupHero.test.tsx apps/brand/src/styles.css
git commit -m "fix(brand): reveal group foreground once"
```

---

### Task 2: Separate Mobile and Desktop Gesture Physics

**Files:**

- Modify: `apps/brand/src/concepts/skiing/groupTransition.ts:1-33`
- Modify: `apps/brand/src/concepts/skiing/groupTransition.test.ts:1-54`

**Interfaces:**

- Produces: `export type GroupGestureKind = 'desktop' | 'mobile'`.
- Produces: `export interface GroupGestureProfile { dragCommitRatio; flickMinDistanceRatio; flickProjectionRatio; gestureThreshold; minFlingVelocity }`.
- Produces: `getGroupGestureProfile(kind: GroupGestureKind): GroupGestureProfile`.
- Changes: `shouldEnterGroup(intent, profile = getGroupGestureProfile('desktop'))` so existing callers and desktop behavior remain compatible.
- Consumes: existing `projectTravel`, `rubberband`, and viewport-height intent.

- [ ] **Step 1: Write failing profile tests with exact boundaries**

Replace the current hard-coded physics expectations with explicit profile coverage:

```ts
it('keeps the existing desktop profile', () => {
  const profile = getGroupGestureProfile('desktop')

  expect(profile).toEqual({
    dragCommitRatio: 0.28,
    flickMinDistanceRatio: 0.08,
    flickProjectionRatio: 0.16,
    gestureThreshold: 10,
    minFlingVelocity: 900,
  })
  expect(shouldEnterGroup({ distance: 237, velocity: 0, viewportHeight: 844 }, profile)).toBe(true)
  expect(shouldEnterGroup({ distance: 120, velocity: 0, viewportHeight: 844 }, profile)).toBe(false)
})

it('uses a more responsive mobile profile without accepting a slow short drag', () => {
  const profile = getGroupGestureProfile('mobile')

  expect(profile).toEqual({
    dragCommitRatio: 0.18,
    flickMinDistanceRatio: 0.05,
    flickProjectionRatio: 0.16,
    gestureThreshold: 8,
    minFlingVelocity: 650,
  })
  expect(shouldEnterGroup({ distance: 152, velocity: 0, viewportHeight: 844 }, profile)).toBe(true)
  expect(shouldEnterGroup({ distance: 80, velocity: 650, viewportHeight: 844 }, profile)).toBe(true)
  expect(shouldEnterGroup({ distance: 80, velocity: 0, viewportHeight: 844 }, profile)).toBe(false)
})
```

Keep the existing momentum, wheel, velocity-sample, and normalization tests unchanged.

- [ ] **Step 2: Run the physics test and verify it fails**

Run:

```bash
pnpm --filter @gaoge/app-brand test -- src/concepts/skiing/groupTransition.test.ts
```

Expected: FAIL because `getGroupGestureProfile` and the profile parameter do not exist.

- [ ] **Step 3: Implement immutable profiles and profile-aware intent**

In `groupTransition.ts`, define the exact values and keep the desktop profile as the default:

```ts
export type GroupGestureKind = 'desktop' | 'mobile'

export interface GroupGestureProfile {
  readonly dragCommitRatio: number
  readonly flickMinDistanceRatio: number
  readonly flickProjectionRatio: number
  readonly gestureThreshold: number
  readonly minFlingVelocity: number
}

const GROUP_GESTURE_PROFILES: Record<GroupGestureKind, GroupGestureProfile> = {
  desktop: {
    dragCommitRatio: 0.28,
    flickMinDistanceRatio: 0.08,
    flickProjectionRatio: 0.16,
    gestureThreshold: 10,
    minFlingVelocity: 900,
  },
  mobile: {
    dragCommitRatio: 0.18,
    flickMinDistanceRatio: 0.05,
    flickProjectionRatio: 0.16,
    gestureThreshold: 8,
    minFlingVelocity: 650,
  },
}

export function getGroupGestureProfile(kind: GroupGestureKind) {
  return GROUP_GESTURE_PROFILES[kind]
}

export function shouldEnterGroup(
  { distance, velocity, viewportHeight }: GroupTransitionIntent,
  profile = getGroupGestureProfile('desktop'),
) {
  if (distance >= viewportHeight * profile.dragCommitRatio) return true

  return (
    distance >= viewportHeight * profile.flickMinDistanceRatio &&
    velocity >= profile.minFlingVelocity &&
    projectTravel(distance, velocity) >= viewportHeight * profile.flickProjectionRatio
  )
}
```

- [ ] **Step 4: Run the physics tests and typecheck**

Run:

```bash
pnpm --filter @gaoge/app-brand test -- src/concepts/skiing/groupTransition.test.ts
pnpm --filter @gaoge/app-brand typecheck
```

Expected: PASS; default `shouldEnterGroup(intent)` assertions still use desktop values.

- [ ] **Step 5: Commit the gesture profiles**

```bash
git add apps/brand/src/concepts/skiing/groupTransition.ts apps/brand/src/concepts/skiing/groupTransition.test.ts
git commit -m "refactor(brand): profile group swipe physics"
```

---

### Task 3: Capture Mobile Swipes Across the Noninteractive Homepage

**Files:**

- Modify: `apps/brand/src/concepts/skiing/components/GroupSwipeEntry.tsx:1-412`
- Modify: `apps/brand/src/concepts/skiing/components/GroupSwipeEntry.test.tsx:1-392`
- Modify: `apps/brand/src/styles.css:342-466`
- Modify: `apps/brand/src/App.test.tsx:180-245`

**Interfaces:**

- Consumes: `getGroupGestureProfile(kind)` and `shouldEnterGroup(intent, profile)` from Task 2.
- Produces: viewport pointer ownership for coarse pointers and existing swipe-button ownership for fine pointers.
- Produces: `data-group-swipe-control` on the bottom button so it is the only interactive exception.
- Produces: `.group-swipe-viewport { touch-action: pan-x; }` only under `(pointer: coarse)` while home-mode pointer listeners are active.
- Preserves: one-pointer ownership, pointer capture, click suppression, unready reveal, wheel reset, spring velocity, disabled/reduced-motion guards, and desktop wheel/button behavior.

- [ ] **Step 1: Extend the pointer mock and write failing mobile surface tests**

Give `PointerEventMock` a `pointerType` property and make `renderEntry` configure coarse-pointer matching:

```ts
class PointerEventMock extends MouseEvent {
  readonly pointerId: number
  readonly pointerType: string

  constructor(type: string, init: PointerEventInit = {}) {
    super(type, init)
    this.pointerId = init.pointerId ?? 0
    this.pointerType = init.pointerType ?? 'mouse'
  }
}

function setCoarsePointer(coarse: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches: query === '(pointer: coarse)' ? coarse : false,
      media: query,
      onchange: null,
      removeEventListener: vi.fn(),
      removeListener: vi.fn(),
    })),
  })
}
```

Add a noninteractive child and interactive controls to `homeContent`, then add these tests:

```tsx
it('commits a mobile drag from the noninteractive homepage surface at 18 percent', async () => {
  setCoarsePointer(true)
  const { onComplete } = renderEntry({
    homeContent: <div data-testid="home-surface">首页内容</div>,
  })
  const surface = screen.getByTestId('home-surface')

  fireEvent.pointerDown(surface, { clientY: 700, pointerId: 1, pointerType: 'touch' })
  fireEvent.pointerMove(surface, { clientY: 548, pointerId: 1, pointerType: 'touch' })
  fireEvent.pointerUp(surface, { clientY: 548, pointerId: 1, pointerType: 'touch' })

  await vi.waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1))
})

it.each(['link', 'button', 'input', 'dialog', 'ignored'] as const)(
  'does not start the mobile page gesture from %s content',
  (targetName) => {
    setCoarsePointer(true)
    const { onComplete } = renderEntry({
      homeContent: (
        <div>
          <a data-testid="link" href="/content">
            链接
          </a>
          <button data-testid="button" type="button">
            能力
          </button>
          <input data-testid="input" />
          <dialog data-testid="dialog">弹层</dialog>
          <div data-group-transition-ignore data-testid="ignored">
            忽略区域
          </div>
        </div>
      ),
    })
    const target = screen.getByTestId(targetName)

    fireEvent.pointerDown(target, { clientY: 700, pointerId: 2, pointerType: 'touch' })
    fireEvent.pointerMove(target, { clientY: 400, pointerId: 2, pointerType: 'touch' })
    fireEvent.pointerUp(target, { clientY: 400, pointerId: 2, pointerType: 'touch' })

    expect(onComplete).not.toHaveBeenCalled()
  },
)

it('keeps fine-pointer surface drags disabled while the swipe button still works', async () => {
  setCoarsePointer(false)
  const { onComplete } = renderEntry({
    homeContent: <div data-testid="home-surface">首页内容</div>,
  })

  fireEvent.pointerDown(screen.getByTestId('home-surface'), {
    clientY: 700,
    pointerId: 1,
    pointerType: 'mouse',
  })
  fireEvent.pointerMove(screen.getByTestId('home-surface'), {
    clientY: 400,
    pointerId: 1,
    pointerType: 'mouse',
  })
  fireEvent.pointerUp(screen.getByTestId('home-surface'), {
    clientY: 400,
    pointerId: 1,
    pointerType: 'mouse',
  })
  expect(onComplete).not.toHaveBeenCalled()

  const entry = screen.getByRole('button', { name: '上滑了解高歌集团' })
  fireEvent.pointerDown(entry, { clientY: 700, pointerId: 2, pointerType: 'mouse' })
  fireEvent.pointerMove(entry, { clientY: 430, pointerId: 2, pointerType: 'mouse' })
  fireEvent.pointerUp(entry, { clientY: 430, pointerId: 2, pointerType: 'mouse' })
  await vi.waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1))
})
```

Also update `RenderEntryOptions` to accept `homeContent?: React.ReactNode`, defaulting to the existing homepage content.

- [ ] **Step 2: Run the component tests and verify the new cases fail**

Run:

```bash
pnpm --filter @gaoge/app-brand test -- src/concepts/skiing/components/GroupSwipeEntry.test.tsx
```

Expected: FAIL because pointer handlers are still attached only to the bottom button and always use desktop thresholds.

- [ ] **Step 3: Add target filtering and stable per-pointer profile selection**

In `GroupSwipeEntry.tsx`, import `type GroupGestureProfile` and `getGroupGestureProfile`. Replace `GESTURE_THRESHOLD` with a profile ref:

```tsx
const INTERACTIVE_POINTER_TARGET =
  'a, button, dialog, input, select, textarea, [contenteditable], [data-group-transition-ignore]'

function isSwipeControl(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest('[data-group-swipe-control]'))
}

function blocksPageGesture(target: EventTarget | null) {
  if (!(target instanceof Element) || isSwipeControl(target)) return false
  return Boolean(target.closest(INTERACTIVE_POINTER_TARGET))
}

function hasCoarsePointer(event: ReactPointerEvent<HTMLDivElement>) {
  return event.pointerType === 'touch' || window.matchMedia('(pointer: coarse)').matches
}
```

Create `pointerProfileRef = useRef<GroupGestureProfile>(getGroupGestureProfile('desktop'))`. On pointer down:

```tsx
const coarsePointer = hasCoarsePointer(event)
if ((!coarsePointer && !isSwipeControl(event.target)) || blocksPageGesture(event.target)) return

pointerProfileRef.current = getGroupGestureProfile(coarsePointer ? 'mobile' : 'desktop')
```

Use `pointerProfileRef.current.gestureThreshold` in move and pass the same profile to release intent:

```tsx
if (!didDragRef.current && Math.abs(distance) < pointerProfileRef.current.gestureThreshold) return

if (
  shouldEnterGroup(
    { distance, velocity, viewportHeight: viewportHeight() },
    pointerProfileRef.current,
  )
) {
  enterGroup(velocity)
} else {
  settleHome()
}
```

This profile is selected once at pointer down so media-query changes cannot alter an in-flight gesture.

- [ ] **Step 4: Move pointer ownership from the button to the viewport**

Change pointer handler event generics to `ReactPointerEvent<HTMLDivElement>`. Remove `onPointerDown`, `onPointerMove`, `onPointerUp`, and `onPointerCancel` from the button; add `data-group-swipe-control` to it. Attach the handlers to both viewport return branches:

```tsx
<div
  className="group-swipe-viewport"
  data-mode={mode}
  data-testid="group-swipe-viewport"
  onPointerCancel={(event) => finishPointer(event, true)}
  onPointerDown={handlePointerDown}
  onPointerMove={handlePointerMove}
  onPointerUp={finishPointer}
  ref={viewportRef}
>
```

Keep `event.currentTarget.setPointerCapture`/`releasePointerCapture`, which now captures on the stable viewport. Do not call `stopPropagation`; rejected interactive targets retain native behavior. Keep `suppressClickRef` so a drag beginning on the chevron does not also invoke its click action.

- [ ] **Step 5: Negotiate mobile touch ownership in CSS**

Add the mode attribute to the viewport and add this CSS beside the scene rules:

```css
@media (pointer: coarse) {
  .group-swipe-viewport[data-mode='home'] {
    touch-action: pan-x;
  }
}
```

Keep `.group-swipe-entry` at `min-h-11 min-w-11`, retain the compact chevron, and do not add a larger visible hint.

- [ ] **Step 6: Add the route-level mobile surface integration test**

In `App.test.tsx`, create a mobile `matchMedia` response where `(pointer: coarse)` is true and `prefers-reduced-motion` is false. Render `/`, target a stable noninteractive homepage element such as the hero heading, and dispatch a 152px touch drag for the 844px test viewport:

```tsx
fireEvent.pointerDown(await screen.findByRole('heading', { name: 'enjoy your passion' }), {
  clientY: 700,
  pointerId: 1,
  pointerType: 'touch',
})
fireEvent.pointerMove(screen.getByRole('heading', { name: 'enjoy your passion' }), {
  clientY: 548,
  pointerId: 1,
  pointerType: 'touch',
})
fireEvent.pointerUp(screen.getByRole('heading', { name: 'enjoy your passion' }), {
  clientY: 548,
  pointerId: 1,
  pointerType: 'touch',
})

await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/group'))
expect(await screen.findByRole('heading', { name: 'GAOGE GROUP' })).toBeInTheDocument()
expect(screen.getByTestId('group-swipe-group-layer')).not.toHaveAttribute('aria-hidden')
```

Use an unambiguous Group assertion already present in the suite (`GAOGE GROUP` and the active Group layer) instead of introducing production test IDs.

- [ ] **Step 7: Run pointer, physics, route, and style verification**

Run:

```bash
pnpm --filter @gaoge/app-brand test -- src/concepts/skiing/groupTransition.test.ts src/concepts/skiing/components/GroupSwipeEntry.test.tsx src/brand/components/HomeGroupRouteShell.test.tsx src/App.test.tsx
pnpm exec stylelint apps/brand/src/styles.css
pnpm --filter @gaoge/app-brand typecheck
```

Expected: PASS, including mobile 18% drag, fast-flick/slow-drag distinction, interactive exclusions, pointer cancellation, single-pointer ownership, desktop button drag, wheel accumulation, loading failure, and persistent-node checks.

- [ ] **Step 8: Commit viewport gesture capture**

```bash
git add apps/brand/src/concepts/skiing/components/GroupSwipeEntry.tsx apps/brand/src/concepts/skiing/components/GroupSwipeEntry.test.tsx apps/brand/src/styles.css apps/brand/src/App.test.tsx
git commit -m "fix(brand): improve mobile group swipe response"
```

---

### Task 4: Full Verification and Browser QA

**Files:**

- Verify: `apps/brand/src/**/*`
- Verify: `docs/superpowers/specs/2026-08-09-brand-group-entry-reveal-mobile-gesture-design.md`

**Interfaces:**

- Consumes: all state, physics, gesture, and styling work from Tasks 1-3.
- Produces: fresh automated and visual evidence that the confirmed design is met without loading, accessibility, or desktop regressions.

- [ ] **Step 1: Run the complete Brand automated verification suite**

Run:

```bash
pnpm --filter @gaoge/app-brand test
pnpm --filter @gaoge/app-brand typecheck
pnpm --filter @gaoge/app-brand build
pnpm exec prettier --check apps/brand/src docs/superpowers/plans/2026-08-09-brand-group-entry-reveal-mobile-gesture.md
pnpm exec eslint apps/brand/src
pnpm exec stylelint "apps/brand/src/**/*.{css,scss}"
```

Expected: every command exits `0`; the full Vitest summary contains no failed or skipped regression caused by this change, and Vite builds the production bundle.

- [ ] **Step 2: Start the Brand development server for visual verification**

Run:

```bash
pnpm --filter @gaoge/app-brand dev -- --host 127.0.0.1
```

Expected: Vite reports a local URL on `127.0.0.1` and stays running for browser checks.

- [ ] **Step 3: Verify desktop entry at 1440×900**

Open `/` at `1440×900` and check click, slow button drag, fast button flick, and wheel entry. For each path verify:

- the building background remains spatially continuous during the full-page move;
- Group navigation, copy, and orbit are invisible while staged;
- after `/group` activates, those three foreground units fade/raise from invisible exactly once;
- no element becomes visible, disappears, and reappears;
- desktop drag distance and wheel cadence feel unchanged;
- browser back returns to the homepage top and permits a second entry;
- console has no React, pointer, passive-listener, or resource errors.

- [ ] **Step 4: Verify mobile entry at 390×844 and 320×800**

Emulate a coarse touch pointer at both sizes. Start upward drags from the hero heading, image/background empty space, and the lower noninteractive half of the page. Verify:

- movement starts after about `8px` and follows the finger 1:1;
- a normal upward drag around `18%` of viewport height commits;
- a short fast flick that clears the `5%`, `650px/s`, and `16%` projected-travel gates commits, while the same slow distance returns home;
- Group foreground remains absent during the slide and appears once after activation;
- links, navigation/ability buttons, dialogs, form controls, and marked ignore areas do not move the page;
- the compact chevron remains clickable and does not consume extra visual space;
- no horizontal overflow or clipped Group content appears.

- [ ] **Step 5: Verify reduced motion and direct-route isolation**

With reduced motion enabled, enter from `/` by clicking the chevron and verify Group content appears immediately after route activation with no screen or foreground interpolation. Then load `/group` in a fresh tab and verify:

- direct Group uses its own initial presentation and contains the full organization page;
- network requests contain no skiing video, `/assets/brand/skiing-poster.jpg`, or `SkiingPage` chunk;
- the homepage DOM and `group-swipe-viewport` are absent;
- navigation, capability dialog, focus order, `inert`, and `aria-hidden` behavior remain correct.

- [ ] **Step 6: Inspect the final diff and knowledge impact**

Run:

```bash
git diff --check HEAD~3..HEAD
git status --short
```

Expected: no whitespace errors and no unrelated files. Call knowledge-base `impact_for_changes` with the modified paths under `apps/brand/src/brand/components`, `apps/brand/src/pages/group`, `apps/brand/src/concepts/skiing`, plus `apps/brand/src/styles.css` and `apps/brand/src/App.test.tsx`; because the current repository lookup has no Brand source map and incorrectly falls back to `gaoge-compass`, report that no reliable knowledge page was used and suggest a later `kb-maintainer` mapping repair without blocking this fix.

- [ ] **Step 7: Record any verification-only adjustment**

If browser QA required a source adjustment, rerun the closest focused test plus the complete commands from Step 1, then commit only those verified files:

```bash
git add apps/brand/src/brand/components/HomeGroupRouteShell.tsx apps/brand/src/brand/components/HomeGroupRouteShell.test.tsx apps/brand/src/brand/components/BrandPageShell.tsx apps/brand/src/brand/components/BrandNavigation.tsx apps/brand/src/pages/group/GroupPage.tsx apps/brand/src/pages/group/GroupPage.test.tsx apps/brand/src/pages/group/components/GroupHero.tsx apps/brand/src/pages/group/components/GroupHero.test.tsx apps/brand/src/concepts/skiing/groupTransition.ts apps/brand/src/concepts/skiing/groupTransition.test.ts apps/brand/src/concepts/skiing/components/GroupSwipeEntry.tsx apps/brand/src/concepts/skiing/components/GroupSwipeEntry.test.tsx apps/brand/src/styles.css apps/brand/src/App.test.tsx
git commit -m "fix(brand): polish group entry interaction"
```

If no source adjustment was required, do not create an empty commit.
