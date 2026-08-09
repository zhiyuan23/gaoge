# Brand Persistent Home–Group Transition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the homepage swipe reveal the real, persistent Group page DOM while ensuring a direct `/group` visit never loads or requests the homepage video.

**Architecture:** A pathless React Router parent keeps `HomeGroupRouteShell` mounted across `/` and `/group`. Home-originated sessions render a gesture scene with a fixed homepage layer and the real Group page as a fixed second layer; route completion changes the Group wrapper to normal document flow without replacing its child node. Direct Group sessions take a separate branch that renders only the lazy Group page and never renders the lazy Skiing page.

**Tech Stack:** React 18, React Router 6, TypeScript, Framer Motion, Tailwind CSS, authored CSS, Vitest, Testing Library, Vite.

## Global Constraints

- Keep `/` and `/group` as distinct URLs and preserve normal browser history.
- Direct `/group` must not execute the Skiing page module, create a `<video>`, or request the skiing poster/video URL.
- The Group root DOM node revealed during the gesture must be the same node after URL completion.
- Preserve all existing gesture thresholds, velocity projection, wheel accumulation, rubber-band, duplicate-navigation, dialog-disable, keyboard, and reduced-motion behavior.
- Hidden Group content must be `inert`, `aria-hidden`, clipped, and removed from pointer and keyboard interaction.
- Do not add dependencies, global state, API changes, or changes outside `apps/brand` and the corresponding spec/plan.
- Delete preview/handoff code only after the persistent real-Group path is green.

---

### Task 1: Make Page Metadata and Hero Entrance Stage-Aware

**Files:**

- Modify: `apps/brand/src/brand/metadata.ts`
- Modify: `apps/brand/src/pages/group/GroupPage.tsx`
- Modify: `apps/brand/src/pages/group/components/GroupHero.test.tsx`
- Create: `apps/brand/src/pages/group/GroupPage.test.tsx`

**Interfaces:**

- Produces: `useBrandMetadata({ description, enabled?, title }): void`, with `enabled` defaulting to `true`.
- Produces: `GroupPage({ metadataActive?: boolean, skipHeroEntrance?: boolean })`.
- Removes later: GroupPage ownership of `location.state`, `useNavigate`, and `GroupRouteHandoff`.

- [ ] **Step 1: Write failing stage-aware Group page tests**

Create `GroupPage.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import GroupPage from '@/pages/group/GroupPage'

function renderGroup(props: { metadataActive?: boolean; skipHeroEntrance?: boolean } = {}) {
  return render(
    <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <GroupPage {...props} />
    </MemoryRouter>,
  )
}

describe('GroupPage staging', () => {
  it('does not replace homepage metadata while staged', () => {
    document.title = '高歌首页'
    renderGroup({ metadataActive: false, skipHeroEntrance: true })

    expect(screen.getByRole('heading', { name: 'GAOGE GROUP' })).toBeInTheDocument()
    expect(document.title).toBe('高歌首页')
  })

  it('owns group metadata when active', () => {
    renderGroup({ metadataActive: true })
    expect(document.title).toBe('高歌集团 - 让热爱持续生长')
  })
})
```

Retain `GroupHero.test.tsx` coverage that `skipEntranceAnimation` produces `initial={false}` behavior.

- [ ] **Step 2: Run focused tests and verify RED**

```bash
pnpm --filter @gaoge/app-brand exec vitest run src/pages/group/GroupPage.test.tsx src/pages/group/components/GroupHero.test.tsx
```

Expected: FAIL because `GroupPage` has no staging props and always writes Group metadata.

- [ ] **Step 3: Add conditional metadata support**

Extend the metadata type and effect:

```ts
interface BrandMetadata {
  readonly description: string
  readonly enabled?: boolean
  readonly title: string
}

export function useBrandMetadata({ description, enabled = true, title }: BrandMetadata): void {
  useEffect(() => {
    if (!enabled) return

    const previousTitle = document.title
    const existingDescription = document.head.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    )
    const descriptionElement = existingDescription ?? document.createElement('meta')
    const createdDescription = !existingDescription
    const previousDescription = existingDescription?.content ?? ''

    if (createdDescription) {
      descriptionElement.name = 'description'
      document.head.appendChild(descriptionElement)
    }

    document.title = title
    descriptionElement.content = description

    return () => {
      document.title = previousTitle

      if (createdDescription) {
        descriptionElement.remove()
      } else {
        descriptionElement.content = previousDescription
      }
    }
  }, [description, enabled, title])
}
```

Refactor `GroupPage` to accept props and remove route-state behavior:

```tsx
interface GroupPageProps {
  readonly metadataActive?: boolean
  readonly skipHeroEntrance?: boolean
}

export default function GroupPage({
  metadataActive = true,
  skipHeroEntrance = false,
}: GroupPageProps) {
  useBrandMetadata({
    description:
      '认识高歌集团和数字、内容、影视、体育四个事业部，看见我们如何从热爱出发，让想法持续生长。',
    enabled: metadataActive,
    title: '高歌集团 - 让热爱持续生长',
  })

  return (
    <BrandPageShell current="group">
      <GroupHero industries={groupIndustries} skipEntranceAnimation={skipHeroEntrance} />
      <DigitalStructure products={groupDigitalProducts} />
      <SportsStructure entities={sportsEntities} />
      <LeadershipStructure leaders={groupLeaders} />
      <LeagueBoard directors={leagueDirectors} />
      <GroupVision items={groupVisionItems} />
    </BrandPageShell>
  )
}
```

- [ ] **Step 4: Run focused tests and verify GREEN**

Run the Task 1 command again. Expected: both files PASS with no router or React warnings.

- [ ] **Step 5: Commit**

```bash
git add apps/brand/src/brand/metadata.ts apps/brand/src/pages/group/GroupPage.tsx apps/brand/src/pages/group/GroupPage.test.tsx apps/brand/src/pages/group/components/GroupHero.test.tsx
git commit -m "refactor(brand): make group page stage aware"
```

---

### Task 2: Decouple the Skiing Page From Route Transition Ownership

**Files:**

- Modify: `apps/brand/src/concepts/skiing/SkiingPage.tsx`
- Modify: `apps/brand/src/concepts/skiing/components/SkiingHero.tsx`
- Modify: `apps/brand/src/concepts/skiing/components/SkiingHero.test.tsx`
- Delete: `apps/brand/src/concepts/skiing/components/SkiingHeroNavigation.test.tsx`

**Interfaces:**

- Produces: `SkiingPage({ onCapabilityOpenChange?, onGroupNavigate? })`.
- Produces: `SkiingHero({ onCapabilityOpenChange?, onGroupNavigate? })`.
- Removes: SkiingHero imports of `GroupSwipeEntry`, `loadGroupPage`, `preloadGroupPage`, and `useNavigate`.
- Preserves: `/concepts/skiing` default behavior where the normal `/group` Link remains functional.

- [ ] **Step 1: Write failing ownership tests**

Update `SkiingHero.test.tsx`:

```tsx
it('delegates group navigation and capability state to its parent', () => {
  const onCapabilityOpenChange = vi.fn()
  const onGroupNavigate = vi.fn()

  render(
    <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <SkiingHero
        onCapabilityOpenChange={onCapabilityOpenChange}
        onGroupNavigate={onGroupNavigate}
      />
    </MemoryRouter>,
  )

  fireEvent.click(screen.getByRole('link', { name: '高歌集团' }))
  expect(onGroupNavigate).toHaveBeenCalledTimes(1)

  fireEvent.click(screen.getByRole('button', { name: '数字' }))
  expect(onCapabilityOpenChange).toHaveBeenCalledWith(true)
})
```

Add a test that the rendered Skiing page no longer contains `group-swipe-viewport`; the shell will own it in Task 4.

- [ ] **Step 2: Run the focused test and verify RED**

```bash
pnpm --filter @gaoge/app-brand exec vitest run src/concepts/skiing/components/SkiingHero.test.tsx
```

Expected: FAIL because SkiingHero does not accept callbacks and still renders `GroupSwipeEntry` internally.

- [ ] **Step 3: Refactor SkiingHero to a pure homepage surface**

Add props:

```ts
interface SkiingHeroProps {
  readonly onCapabilityOpenChange?: (open: boolean) => void
  readonly onGroupNavigate?: () => void
}
```

Keep the current poster, video playback effects, hero copy, four `BrandSignal` controls, and `navigationRef`. Remove the `GroupSwipeEntry` wrapper so the returned root is the current `<section id="top">`. Change the navigation block to:

```tsx
<SkiingNavbar
  ref={navigationRef}
  onCapabilityOpenChange={onCapabilityOpenChange}
  onGroupNavigate={onGroupNavigate}
/>
```

`SkiingPage` forwards the same optional props to `SkiingHero`. Without `onGroupNavigate`, `BrandNavigation` retains its real Link navigation behavior.

Delete `SkiingHeroNavigation.test.tsx`; its delayed-route responsibility moves to the shell readiness tests.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run Task 2 tests again. Expected: all Skiing tests PASS, no swipe viewport appears inside SkiingHero, and normal concept navigation still has an `/group` href.

- [ ] **Step 5: Commit**

```bash
git add apps/brand/src/concepts/skiing/SkiingPage.tsx apps/brand/src/concepts/skiing/components/SkiingHero.tsx apps/brand/src/concepts/skiing/components/SkiingHero.test.tsx apps/brand/src/concepts/skiing/components/SkiingHeroNavigation.test.tsx
git commit -m "refactor(brand): decouple skiing page transition"
```

---

### Task 3: Convert GroupSwipeEntry to a Real Two-Layer Scene

**Files:**

- Modify: `apps/brand/src/concepts/skiing/components/GroupSwipeEntry.tsx`
- Modify: `apps/brand/src/concepts/skiing/components/GroupSwipeEntry.test.tsx`
- Modify: `apps/brand/src/styles.css`

**Interfaces:**

- Consumes:

```ts
interface GroupSwipeEntryProps {
  readonly disabled: boolean
  readonly groupContent: ReactNode | null
  readonly groupReady: boolean
  readonly homeContent: ReactNode
  readonly mode: 'group' | 'home'
  readonly onComplete: () => void
  readonly onPrepareGroup: () => Promise<boolean>
}
```

- Preserves: `GroupSwipeEntryHandle.enterGroup(): void`.
- Produces: `data-testid="group-swipe-home-layer"` and `data-testid="group-swipe-group-layer"`.
- The Group layer keeps the same keyed DOM position when `mode` changes.

- [ ] **Step 1: Write failing real-layer and accessibility tests**

Refactor the test renderer to pass separate home/group content:

```tsx
function renderEntry({
  groupReady = true,
  mode = 'home',
  onComplete = vi.fn(),
  onPrepareGroup = vi.fn().mockResolvedValue(true),
} = {}) {
  return render(
    <GroupSwipeEntry
      disabled={false}
      groupContent={groupReady ? <div data-testid="real-group">真实集团页</div> : null}
      groupReady={groupReady}
      homeContent={<div>首页内容</div>}
      mode={mode}
      onComplete={onComplete}
      onPrepareGroup={onPrepareGroup}
    />,
  )
}
```

Add assertions:

```tsx
it('stages the real group content outside the accessible tree', () => {
  renderEntry()
  const groupLayer = screen.getByTestId('group-swipe-group-layer')
  expect(screen.getByTestId('real-group')).toBeInTheDocument()
  expect(groupLayer).toHaveAttribute('aria-hidden', 'true')
  expect(groupLayer).toHaveAttribute('inert')
})

it('keeps the same group node when switching to group mode', () => {
  const groupContent = <div data-testid="real-group">真实集团页</div>
  const onComplete = vi.fn()
  const onPrepareGroup = vi.fn().mockResolvedValue(true)
  const view = render(
    <GroupSwipeEntry
      disabled={false}
      groupContent={groupContent}
      groupReady
      homeContent={<div>首页内容</div>}
      mode="home"
      onComplete={onComplete}
      onPrepareGroup={onPrepareGroup}
    />,
  )
  const groupNode = screen.getByTestId('real-group')
  view.rerender(
    <GroupSwipeEntry
      disabled={false}
      groupContent={groupContent}
      groupReady
      homeContent={<div>首页内容</div>}
      mode="group"
      onComplete={onComplete}
      onPrepareGroup={onPrepareGroup}
    />,
  )
  expect(screen.getByTestId('real-group')).toBe(groupNode)
  expect(screen.getByTestId('group-swipe-group-layer')).not.toHaveAttribute('inert')
})

it('moves the home and real group layers from one continuous offset', async () => {
  renderEntry()
  const entry = screen.getByRole('button', { name: '上滑了解高歌集团' })

  fireEvent.pointerDown(entry, { clientY: 700, pointerId: 1 })
  fireEvent.pointerMove(entry, { clientY: 600, pointerId: 1 })

  await vi.waitFor(() => {
    expect(screen.getByTestId('group-swipe-home-layer')).toHaveStyle({
      transform: 'translate3d(0, -100px, 0)',
    })
    expect(screen.getByTestId('group-swipe-group-layer').style.transform).toContain(
      'calc(100dvh + -100px)',
    )
  })
})
```

Assert `GroupTransitionPreview` is absent.

Add reduced-motion coverage to the same file:

```tsx
it('does not mount the offscreen group layer with reduced motion', async () => {
  reducedMotion = true
  const onComplete = vi.fn()
  const onPrepareGroup = vi.fn().mockResolvedValue(true)
  renderEntry({ groupReady: false, onComplete, onPrepareGroup })

  expect(screen.queryByTestId('group-swipe-group-layer')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: '上滑了解高歌集团' }))

  await vi.waitFor(() => expect(onPrepareGroup).toHaveBeenCalledTimes(1))
  expect(onComplete).toHaveBeenCalledTimes(1)
})
```

- [ ] **Step 2: Write failing readiness and failure tests**

Use a deferred Promise:

```tsx
it('queues one entry intent until the real group page is ready', async () => {
  let finishPreparation: ((ready: boolean) => void) | undefined
  const onPrepareGroup = vi.fn(
    () => new Promise<boolean>((resolve) => (finishPreparation = resolve)),
  )
  const onComplete = vi.fn()
  const view = render(
    <GroupSwipeEntry
      disabled={false}
      groupContent={null}
      groupReady={false}
      homeContent={<div>首页内容</div>}
      mode="home"
      onComplete={onComplete}
      onPrepareGroup={onPrepareGroup}
    />,
  )

  fireEvent.click(screen.getByRole('button', { name: '上滑了解高歌集团' }))
  expect(onPrepareGroup).toHaveBeenCalledTimes(1)
  expect(onComplete).not.toHaveBeenCalled()

  view.rerender(
    <GroupSwipeEntry
      disabled={false}
      groupContent={<div data-testid="real-group">真实集团页</div>}
      groupReady
      homeContent={<div>首页内容</div>}
      mode="home"
      onComplete={onComplete}
      onPrepareGroup={onPrepareGroup}
    />,
  )
  finishPreparation?.(true)
  await vi.waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1))
})

it('returns control after group loading fails', async () => {
  const onPrepareGroup = vi.fn().mockResolvedValue(false)
  const { onComplete } = renderEntry({ groupReady: false, onPrepareGroup })
  const entry = screen.getByRole('button', { name: '上滑了解高歌集团' })

  fireEvent.click(entry)
  await vi.waitFor(() => expect(onPrepareGroup).toHaveBeenCalledTimes(1))
  expect(onComplete).not.toHaveBeenCalled()
  expect(entry).toBeEnabled()
})
```

- [ ] **Step 3: Run focused tests and verify RED**

```bash
pnpm --filter @gaoge/app-brand exec vitest run src/concepts/skiing/components/GroupSwipeEntry.test.tsx
```

Expected: FAIL because the component still owns a preview and has no mode/readiness API.

- [ ] **Step 4: Implement the persistent layers**

Keep the physics and input handlers. Replace the 200dvh track with two fixed layers driven by one MotionValue:

```tsx
const homeTransform = useTransform(offsetY, (value) => `translate3d(0, ${value}px, 0)`)
const groupTransform = useTransform(
  offsetY,
  (value) => `translate3d(0, calc(100dvh + ${value}px), 0)`,
)

const entryControl = (
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
)

if (reducedMotion && mode === 'home') {
  return (
    <div
      className="group-swipe-viewport relative h-[100dvh] overflow-hidden bg-black"
      data-testid="group-swipe-viewport"
      ref={viewportRef}
    >
      {homeContent}
      {entryControl}
    </div>
  )
}

;<div className="group-swipe-scene" data-mode={mode} data-testid="group-swipe-scene">
  {mode === 'home' ? (
    <motion.div
      className="group-swipe-home-layer"
      data-testid="group-swipe-home-layer"
      key="home"
      style={{ transform: homeTransform }}
    >
      {homeContent}
      {entryControl}
    </motion.div>
  ) : null}
  <motion.div
    aria-hidden={mode === 'home' ? 'true' : undefined}
    className="group-swipe-group-layer"
    data-testid="group-swipe-group-layer"
    inert={mode === 'home' ? true : undefined}
    key="group"
    style={mode === 'home' ? { transform: groupTransform } : undefined}
  >
    {groupContent}
  </motion.div>
</div>
```

In home mode both layers are fixed and clipped to `100dvh`. In group mode, the Group layer becomes relative, overflow becomes visible, transform is removed, and the home layer is absent. Because the Group child and keyed wrapper stay at the same sibling identity, React preserves its DOM node.

Import `useLayoutEffect` from React. Rebase the Group layer and reset scroll before paint on entry; reset the motion guards before paint whenever browser history returns the persistent shell to homepage mode:

```tsx
useLayoutEffect(() => {
  if (mode === 'group') {
    offsetY.set(0)
    window.scrollTo({ left: 0, top: 0 })
    return
  }

  navigatingRef.current = false
  preparingRef.current = false
  offsetY.set(0)
  window.scrollTo({ left: 0, top: 0 })
}, [mode, offsetY])
```

Mock `window.scrollTo` in the test setup. Extend the node-identity test to assert it was called with `{ left: 0, top: 0 }` and the active Group layer has computed `position: relative` after switching to `mode="group"`.

Add a rerender test that starts in `mode="group"`, switches to `mode="home"`, and asserts the home layer is immediately present at its resting transform with the entry control enabled.

```tsx
it('resets the scene before paint when browser history returns home', () => {
  const groupContent = <div data-testid="real-group">真实集团页</div>
  const onComplete = vi.fn()
  const onPrepareGroup = vi.fn().mockResolvedValue(true)
  const view = render(
    <GroupSwipeEntry
      disabled={false}
      groupContent={groupContent}
      groupReady
      homeContent={<div>首页内容</div>}
      mode="group"
      onComplete={onComplete}
      onPrepareGroup={onPrepareGroup}
    />,
  )

  view.rerender(
    <GroupSwipeEntry
      disabled={false}
      groupContent={groupContent}
      groupReady
      homeContent={<div>首页内容</div>}
      mode="home"
      onComplete={onComplete}
      onPrepareGroup={onPrepareGroup}
    />,
  )

  expect(screen.getByTestId('group-swipe-scene')).toHaveAttribute('data-mode', 'home')
  expect(screen.getByRole('button', { name: '上滑了解高歌集团' })).toBeEnabled()
})
```

- [ ] **Step 5: Implement queued preparation without changing physics**

Before completing a click, drag, wheel, or imperative entry:

```ts
if (!groupReadyRef.current) {
  if (preparingRef.current) return
  preparingRef.current = true
  void onPrepareGroupRef.current().then((ready) => {
    preparingRef.current = false
    if (ready) enterPreparedGroup(velocity)
    else settleHome()
  })
  return
}
```

Keep a separate `enterPreparedGroup` callback so re-entry does not collide with `navigatingRef`. On failure clear all navigation/preparation guards. On unmount invalidate the pending sequence so a late Promise cannot navigate.

For pointer movement before Group is ready, cap visible travel with the existing rubber-band helper instead of exposing an empty black layer. A committed release still queues preparation and continues automatically after readiness.

- [ ] **Step 6: Add scene CSS**

Replace `.group-swipe-track` and preview/handoff layout rules:

```css
.group-swipe-scene[data-mode='home'] {
  position: relative;
  height: 100dvh;
  overflow: hidden;
  background: #000;
}

.group-swipe-home-layer,
.group-swipe-scene[data-mode='home'] .group-swipe-group-layer {
  position: fixed;
  inset: 0;
  height: 100dvh;
  overflow: hidden;
  will-change: transform;
}

.group-swipe-group-layer[aria-hidden='true'] {
  pointer-events: none;
}

.group-swipe-scene[data-mode='group'] .group-swipe-group-layer {
  position: relative;
  min-height: 100%;
  overflow: visible;
  transform: none !important;
}
```

Retain the existing chevron styling and mobile/reduced-motion media queries.

- [ ] **Step 7: Run focused tests and verify GREEN**

Run the Task 3 command again. Expected: all existing physics/input tests plus real-layer/readiness/failure tests PASS.

- [ ] **Step 8: Commit**

```bash
git add apps/brand/src/concepts/skiing/components/GroupSwipeEntry.tsx apps/brand/src/concepts/skiing/components/GroupSwipeEntry.test.tsx apps/brand/src/styles.css
git commit -m "refactor(brand): swipe between persistent page layers"
```

---

### Task 4: Add the Persistent HomeGroupRouteShell

**Files:**

- Create: `apps/brand/src/brand/components/HomeGroupRouteShell.tsx`
- Create: `apps/brand/src/brand/components/HomeGroupRouteShell.test.tsx`
- Create: `apps/brand/src/brand/components/ConceptLoading.tsx`
- Modify: `apps/brand/src/App.tsx`
- Modify: `apps/brand/src/App.test.tsx`
- Modify: `apps/brand/src/pages/group/loadGroupPage.ts`

**Interfaces:**

- Consumes: a locally typed lazy import of `@/concepts/skiing/SkiingPage`, `loadGroupPage()`, stage-aware `GroupPage`, and the new `GroupSwipeEntry` API.
- Produces: one persistent shell for both `/` and `/group`.
- Produces: `prepareGroup(): Promise<boolean>` that deduplicates loading and reports failure without throwing into the gesture component.

- [ ] **Step 1: Write failing direct-Group isolation tests**

In `HomeGroupRouteShell.test.tsx`, mock both lazy loaders with hoisted counters:

```tsx
const loaderSpies = vi.hoisted(() => ({
  loadGroupPage: vi.fn(),
  skiingModuleEvaluated: vi.fn(),
}))

function MockGroupPage() {
  return <main data-testid="persistent-group-node">集团页</main>
}

vi.mock('@/pages/group/loadGroupPage', () => ({
  loadGroupPage: loaderSpies.loadGroupPage,
}))

vi.mock('@/concepts/skiing/SkiingPage', () => {
  loaderSpies.skiingModuleEvaluated()
  return {
    default: () => (
      <main>
        <h1>enjoy your passion</h1>
      </main>
    ),
  }
})

beforeEach(() => {
  loaderSpies.loadGroupPage.mockReset()
  loaderSpies.loadGroupPage.mockResolvedValue({ default: MockGroupPage })
  loaderSpies.skiingModuleEvaluated.mockClear()
})
```

Render at `/group` and assert:

```tsx
expect(loaderSpies.loadGroupPage).toHaveBeenCalledTimes(1)
expect(loaderSpies.skiingModuleEvaluated).not.toHaveBeenCalled()
expect(document.querySelector('video')).not.toBeInTheDocument()
expect(screen.queryByTestId('group-swipe-viewport')).not.toBeInTheDocument()
```

The mocked Group page must render a unique `data-testid="persistent-group-node"`.

- [ ] **Step 2: Write failing homepage persistence tests**

Use a deferred Group module Promise:

```tsx
it('keeps the real group node through route completion', async () => {
  renderShellAt('/')
  expect(await screen.findByRole('heading', { name: 'enjoy your passion' })).toBeInTheDocument()

  resolveGroupModule?.({ default: MockGroupPage })
  const stagedGroup = await screen.findByTestId('persistent-group-node')
  expect(screen.getByTestId('group-swipe-group-layer')).toHaveAttribute('inert')

  fireEvent.click(screen.getByRole('button', { name: '上滑了解高歌集团' }))
  await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/group'))

  expect(screen.getByTestId('persistent-group-node')).toBe(stagedGroup)
  expect(screen.queryByRole('heading', { name: 'enjoy your passion' })).not.toBeInTheDocument()
  expect(screen.getByTestId('group-swipe-group-layer')).not.toHaveAttribute('inert')
})
```

Also assert the page title remains the homepage title while Group is staged and switches only after `/group` is active.

In `App.test.tsx`, extend the existing homepage-entry parameterized test after the `/group` assertion:

```tsx
expect(document.querySelector('video')).not.toBeInTheDocument()
expect(screen.getByTestId('group-swipe-group-layer')).not.toHaveAttribute('aria-hidden')
expect(screen.getByTestId('group-swipe-group-layer')).not.toHaveAttribute('inert')
```

Add this test-only history control next to `LocationDisplay`:

```tsx
function HistoryControls() {
  const navigate = useNavigate()
  return (
    <button onClick={() => navigate(-1)} type="button">
      测试返回
    </button>
  )
}
```

Render `<HistoryControls />` next to `<LocationDisplay />` in `renderRoute`, then replace the legacy `group organization route` handoff tests with:

```tsx
it('restores the homepage at the top without a handoff overlay', async () => {
  const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
  renderRoute('/')

  fireEvent.click(await screen.findByRole('button', { name: '上滑了解高歌集团' }))
  await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/group'))

  fireEvent.click(screen.getByRole('button', { name: '测试返回' }))
  expect(await screen.findByRole('heading', { name: 'enjoy your passion' })).toBeInTheDocument()
  expect(scrollTo).toHaveBeenLastCalledWith({ left: 0, top: 0 })
  expect(screen.queryByTestId('group-route-handoff')).not.toBeInTheDocument()
})
```

- [ ] **Step 3: Run focused shell tests and verify RED**

```bash
pnpm --filter @gaoge/app-brand exec vitest run src/brand/components/HomeGroupRouteShell.test.tsx src/App.test.tsx
```

Expected: FAIL because routes still mount separate page elements.

- [ ] **Step 4: Implement loader retry safety**

Make `loadGroupPage()` reset its cached Promise after a rejected dynamic import:

```ts
export function loadGroupPage() {
  groupPagePromise ??= import('@/pages/group/GroupPage').catch((error: unknown) => {
    groupPagePromise = null
    throw error
  })
  return groupPagePromise
}
```

This lets a failed homepage preparation or later direct link retry the chunk.

- [ ] **Step 5: Implement HomeGroupRouteShell**

Key structure:

```tsx
const GroupPage = lazy(loadGroupPage)
const HomepagePage = lazy(() => import('@/concepts/skiing/SkiingPage'))

export default function HomeGroupRouteShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const directGroupSession = useRef(location.pathname === '/group').current
  const swipeRef = useRef<GroupSwipeEntryHandle>(null)
  const [groupReady, setGroupReady] = useState(directGroupSession)
  const [isCapabilityOpen, setIsCapabilityOpen] = useState(false)
  const groupLoadRef = useRef<Promise<boolean> | null>(null)
  const mode = location.pathname === '/group' ? 'group' : 'home'

  const prepareGroup = useCallback(() => {
    groupLoadRef.current ??= loadGroupPage()
      .then(() => {
        setGroupReady(true)
        return new Promise<boolean>((resolve) => {
          requestAnimationFrame(() => resolve(true))
        })
      })
      .catch(() => {
        groupLoadRef.current = null
        return false
      })
    return groupLoadRef.current
  }, [])

  useEffect(() => {
    if (!directGroupSession) void prepareGroup()
  }, [directGroupSession, prepareGroup])

  if (directGroupSession && mode === 'group') {
    return (
      <Suspense fallback={<ConceptLoading />}>
        <GroupPage />
      </Suspense>
    )
  }

  return (
    <GroupSwipeEntry
      disabled={isCapabilityOpen}
      groupContent={
        groupReady ? (
          <Suspense fallback={null}>
            <GroupPage metadataActive={mode === 'group'} skipHeroEntrance />
          </Suspense>
        ) : null
      }
      groupReady={groupReady}
      homeContent={
        mode === 'home' ? (
          <Suspense fallback={<ConceptLoading />}>
            <HomepagePage
              onCapabilityOpenChange={setIsCapabilityOpen}
              onGroupNavigate={() => swipeRef.current?.enterGroup()}
            />
          </Suspense>
        ) : null
      }
      mode={mode}
      onComplete={() => navigate('/group')}
      onPrepareGroup={prepareGroup}
      ref={swipeRef}
    />
  )
}
```

Create `ConceptLoading.tsx` with this exact shared fallback, remove the local function from `App.tsx`, and import the component from both `App.tsx` and `HomeGroupRouteShell.tsx`. The shell must never import from `App.tsx`.

```tsx
export default function ConceptLoading() {
  return (
    <main
      aria-live="polite"
      className="grid min-h-[100dvh] place-items-center bg-[#0c0c0c] text-sm tracking-[0.18em] text-white/50"
    >
      LOADING GAOGE
    </main>
  )
}
```

- [ ] **Step 6: Route both paths through one parent element**

In `App.tsx`:

```tsx
<Routes>
  <Route element={<HomeGroupRouteShell />}>
    <Route index element={null} />
    <Route path="group" element={null} />
  </Route>
  <Route path="/digital" element={<LazyPageRoute component={DigitalPage} />} />
  <Route path="/content" element={<LazyPageRoute component={ContentPage} />} />
  <Route path="/concepts" element={<ConceptIndexPage />} />
  {concepts.map(({ component: ConceptPage, slug }) => (
    <Route
      element={<LazyPageRoute component={ConceptPage} />}
      key={slug}
      path={getConceptPath(slug)}
    />
  ))}
  {legacyConceptRoutes.map(({ from, to }) => (
    <Route
      element={<Navigate replace to={getConceptPath(to)} />}
      key={from}
      path={getConceptPath(from)}
    />
  ))}
  <Route path="/concepts/*" element={<Navigate to="/concepts" replace />} />
  <Route path="*" element={<Navigate to="/" replace />} />
</Routes>
```

Remove the now-unused `loadGroupPage`, `homepageConceptSlug`, `homepageConcept`, `HomepagePage`, and lazy `GroupPage` declarations from `App.tsx`. Keep `BrandConcept`, `concepts`, `getConceptPath`, and `legacyConceptRoutes` for the concept routes. Do not add an `Outlet` that replaces the shell content. Confirm `/concepts/skiing` still uses the registry component directly and does not gain the persistent group scene.

- [ ] **Step 7: Run focused and route tests and verify GREEN**

Run Task 4 tests. Expected: direct Group isolation, hidden Group semantics, DOM identity, metadata timing, existing routes, capability dialogs, top link, and homepage entry tests all PASS.

- [ ] **Step 8: Commit**

```bash
git add apps/brand/src/App.tsx apps/brand/src/App.test.tsx apps/brand/src/brand/components/ConceptLoading.tsx apps/brand/src/brand/components/HomeGroupRouteShell.tsx apps/brand/src/brand/components/HomeGroupRouteShell.test.tsx apps/brand/src/pages/group/loadGroupPage.ts
git commit -m "feat(brand): persist home group route scene"
```

---

### Task 5: Remove the Superseded Preview and Handoff

**Files:**

- Delete: `apps/brand/src/concepts/skiing/components/GroupTransitionPreview.tsx`
- Delete: `apps/brand/src/pages/group/components/GroupRouteHandoff.tsx`
- Delete: `apps/brand/src/pages/group/components/GroupRouteHandoff.test.tsx`
- Modify: `apps/brand/src/App.test.tsx`
- Modify: `apps/brand/src/styles.css`

**Interfaces:**

- Removes: `fromHomeTransition` route state, `group-route-handoff`, `group-transition-preview`, and the 200dvh preview track.
- Preserves: the real Group page, small chevron, all gesture helpers, and direct route behavior.

- [ ] **Step 1: Update route tests to reject legacy handoff behavior**

Replace handoff assertions with:

```tsx
expect(screen.queryByTestId('group-route-handoff')).not.toBeInTheDocument()
expect(screen.queryByTestId('group-transition-preview')).not.toBeInTheDocument()
expect(screen.getByTestId('persistent-group-node')).toBe(stagedGroup)
```

Search for stale route state and component references:

```bash
rg -n "fromHomeTransition|GroupRouteHandoff|GroupTransitionPreview|group-route-handoff|group-transition-preview" apps/brand/src
```

Expected before deletion: matches only in files scheduled for removal or tests being updated.

- [ ] **Step 2: Delete obsolete files and CSS**

Use `apply_patch` to delete the three files and remove `.group-route-handoff`, `.group-transition-preview`, and `.group-swipe-track` rules that no longer serve the real-layer scene.

- [ ] **Step 3: Run all Brand tests**

```bash
pnpm --filter @gaoge/app-brand test
```

Expected: every test passes, with the new persistent-scene tests replacing preview/handoff coverage.

- [ ] **Step 4: Commit**

```bash
git add apps/brand/src
git commit -m "refactor(brand): remove route handoff preview"
```

---

### Task 6: Browser QA, Performance Isolation, and Full Verification

**Files:**

- Modify only files already listed if QA identifies a scoped defect.

**Interfaces:**

- Consumes: complete persistent shell, real-layer gesture, route isolation, and existing responsive indicator.
- Produces: browser and automated evidence for visual continuity and direct-Group resource isolation.

- [ ] **Step 1: Run full automated gates**

```bash
pnpm exec prettier --check apps/brand/src docs/superpowers/specs/2026-08-09-brand-persistent-home-group-transition-design.md docs/superpowers/plans/2026-08-09-brand-persistent-home-group-transition.md
pnpm exec eslint apps/brand/src
pnpm exec stylelint "apps/brand/src/**/*.css"
pnpm --filter @gaoge/app-brand typecheck
pnpm --filter @gaoge/app-brand test
pnpm --filter @gaoge/app-brand build
git diff --check
```

Expected: all commands exit 0 with zero warnings/failures.

- [ ] **Step 2: Verify direct `/group` resource isolation**

Start `pnpm dev:brand`, open a fresh tab directly at `/group`, and verify before visiting `/`:

- no `<video>` node;
- no skiing poster request;
- no CloudFront skiing video request;
- no Skiing page chunk request;
- Group heading, navigation and normal document scrolling work.

Use the browser page-assets/network capability if available; otherwise combine DOM inspection with Vite chunk names from the production build and a fresh-tab resource performance entry inspection.

- [ ] **Step 3: Verify persistent DOM and frame continuity**

At 1440×900:

1. Open `/` and wait for the hidden real Group layer to become ready.
2. Capture a reference marker or stable DOM identity attribute on the Group root.
3. Slowly drag upward and verify the actual Group navigation, heading and orbit are revealed.
4. Complete the gesture and verify the same Group root remains connected after URL becomes `/group`.
5. Compare bounding rectangles immediately before and after URL change; Group hero position must not shift by more than one device pixel.
6. Confirm no Loading, overlay fade, brightness flash, layout jump or console warning.
7. Scroll through Group content to confirm normal document scrolling and sticky navigation.

- [ ] **Step 4: Verify loading and failure behavior**

- With network throttling, activate entry before Group chunk resolves; homepage remains visible, then automatically completes when ready.
- Block or fail the Group chunk once; the scene returns home and the entry becomes usable again.
- Retry through the top Group link and confirm the loader can make a new request.

- [ ] **Step 5: Verify responsive and accessibility behavior**

- 390×844 and 320×800: no horizontal overflow; real Group reveal, chevron, safe area and capability signals do not overlap.
- 844×390 coarse-pointer landscape: visual bottom entry hidden; top Group link remains.
- Hidden Group layer: no focusable descendant enters Tab order.
- After completion: Group navigation becomes focusable and the homepage video node is gone.
- Reduced motion: no full-screen translation; entry waits for Group readiness and changes directly to Group mode.
- Browser back: homepage returns at the top without a second Group handoff overlay.

- [ ] **Step 6: Check knowledge impact**

Call `impact_for_changes` for every changed `apps/brand` path. Current repository context has no reliable source map, so use source and test behavior as primary evidence and report whether a full knowledge rescan remains warranted.

- [ ] **Step 7: Final repository inspection**

```bash
git status --short
git log -10 --oneline
```

Expected: implementation commits are present on the current branch, the worktree contains no uncommitted task files, and nothing has been pushed without explicit authorization.
