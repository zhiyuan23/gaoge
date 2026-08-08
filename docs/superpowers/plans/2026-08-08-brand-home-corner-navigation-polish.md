# Brand Homepage Corner Navigation Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish the Brand homepage Logo, group entry, and `FILM` placement while preserving the existing visual language, routes, dialogs, and mobile four-corner composition.

**Architecture:** Keep the change inside the existing `BrandNavigation` and `SkiingHero` components. Render a homepage-only glyph variant from `BrandNavigation`, expand the existing homepage group link without changing its route or accessible name, and adjust only the desktop Tailwind positioning classes for the existing film signal.

**Tech Stack:** React 18, TypeScript, React Router, Tailwind CSS 3, Vitest, Testing Library, Vite

## Global Constraints

- Preserve the existing homepage video, poster, hero title, copy, capability data, dialog behavior, routes, and mobile four-corner signal layout.
- Apply the enlarged and rotated `G` only on the homepage; keep `/digital`, `/content`, and `/group` Logo styling unchanged.
- Use a 14px homepage `G` rotated with `-rotate-45`; keep the outer 24px circular border unrotated.
- Keep the group link at `/group` with accessible name `进入高歌集团`; add visible `集团` text at 11px with restrained contrast.
- Change the desktop film position from `md:right-20 md:top-[30%]` to `md:right-[12%] md:top-[32%]`; keep mobile `left-4 top-24` unchanged.
- Add no dependencies, routes, APIs, data models, shared packages, or unrelated refactors.
- Preserve all pre-existing uncommitted user changes. The target source and test files are already dirty, so do not commit complete source files unless the user explicitly authorizes including those existing changes.

---

### Task 1: Homepage Logo and Group Entry

**Files:**

- Modify: `apps/brand/src/brand/components/BrandNavigation.tsx:51-58, 140-147, 177-186, 248-259`
- Test: `apps/brand/src/App.test.tsx:55-66, 285-295`

**Interfaces:**

- Consumes: existing `BrandNavigationProps.current: BrandArea` and the existing `/group` `Link`.
- Produces: internal `BrandMark({ home?: boolean }): JSX.Element`; the homepage `Link` named `进入高歌集团` gains visible text but retains the same route and semantics.

- [ ] **Step 1: Add focused assertions for the homepage-only Logo variant and visible group label**

Update the first Skiing route test in `apps/brand/src/App.test.tsx`:

```tsx
const homeLink = screen.getByRole('link', { name: '高歌首页' })
const groupLink = screen.getByRole('link', { name: '进入高歌集团' })

expect(homeLink).toHaveTextContent('GAOGE')
expect(within(homeLink).getByText('G')).toHaveClass('text-[14px]', '-rotate-45')
expect(groupLink).toHaveAttribute('href', '/group')
expect(groupLink).toHaveTextContent('集团')
```

Add non-home preservation assertions inside the existing group route test after `groupNavigation` is defined:

```tsx
const groupHomeLink = within(groupNavigation).getByRole('link', { name: '高歌首页' })
const groupMark = within(groupHomeLink).getByText('G')

expect(groupMark).toHaveClass('text-[11px]')
expect(groupMark).not.toHaveClass('-rotate-45')
```

- [ ] **Step 2: Run the focused route tests and verify the new assertions fail**

Run:

```bash
pnpm --filter @gaoge/app-brand exec vitest run src/App.test.tsx -t "renders the GAOGE brand hero|renders the public group structure"
```

Expected: FAIL because the homepage `G` does not yet have `text-[14px] -rotate-45`, the group link has no visible `集团`, and the non-home glyph has not been moved into its own 11px span.

- [ ] **Step 3: Replace the shared mark constant with a homepage-aware internal component**

Replace `const mark = (...)` in `BrandNavigation.tsx` with:

```tsx
interface BrandMarkProps {
  readonly home?: boolean
}

function BrandMark({ home = false }: BrandMarkProps) {
  return (
    <span
      aria-hidden="true"
      className="grid h-6 w-6 place-items-center rounded-full border border-white/45 font-semibold leading-none text-white"
    >
      <span className={home ? 'inline-block -rotate-45 text-[14px]' : 'text-[11px]'}>G</span>
    </span>
  )
}
```

Use `<BrandMark />` in the `current === 'group'` navigation and `<BrandMark home={current === 'home'} />` in the normal navigation branch. This keeps the existing non-home appearance while applying the transform only to the homepage.

- [ ] **Step 4: Expand the homepage group entry into a restrained labeled capsule**

Replace the homepage group `Link` content and classes with:

```tsx
<Link
  aria-label="进入高歌集团"
  className="group col-start-3 row-start-1 inline-flex h-9 items-center gap-1.5 justify-self-end rounded-full border border-white/10 bg-neutral-900/55 px-3 backdrop-blur transition-colors hover:border-white/25 hover:bg-neutral-900/80 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-white/45"
  title="进入高歌集团"
  to="/group"
>
  <span
    aria-hidden="true"
    className="h-1.5 w-1.5 rounded-full bg-[rgb(var(--brand-accent))] transition-transform duration-200 group-hover:scale-125"
  />
  <span className="text-[11px] font-medium tracking-[0.08em] text-white/55 transition-colors group-hover:text-white/70">
    集团
  </span>
</Link>
```

- [ ] **Step 5: Run the focused route tests and verify they pass**

Run:

```bash
pnpm --filter @gaoge/app-brand exec vitest run src/App.test.tsx -t "renders the GAOGE brand hero|renders the public group structure"
```

Expected: both selected tests PASS.

- [ ] **Step 6: Review the narrow navigation class composition**

Confirm from the JSX that the homepage center capability navigation remains `hidden ... md:flex`, the left `GAOGE` wordmark still hides at `max-[384px]`, and the group link has no fixed width or wrapping class that could force a second line.

### Task 2: Desktop FILM Position and Complete Verification

**Files:**

- Modify: `apps/brand/src/concepts/skiing/components/SkiingHero.tsx:117-125`
- Test: `apps/brand/src/concepts/skiing/components/SkiingHero.test.tsx:37-68`

**Interfaces:**

- Consumes: existing `BrandSignal` props and the `film` capability mapping.
- Produces: the same `打开影视能力说明` button with unchanged mobile classes and new desktop position classes `md:right-[12%] md:top-[32%]`.

- [ ] **Step 1: Add an exact responsive-position assertion for the film signal**

Append this assertion to the existing `uses linear mobile signals and the refined mobile title rhythm` test:

```tsx
expect(screen.getByRole('button', { name: '打开影视能力说明' })).toHaveClass(
  'left-4',
  'top-24',
  'md:left-auto',
  'md:right-[12%]',
  'md:top-[32%]',
)
```

- [ ] **Step 2: Run the focused hero test and verify the new assertion fails**

Run:

```bash
pnpm --filter @gaoge/app-brand exec vitest run src/concepts/skiing/components/SkiingHero.test.tsx -t "uses linear mobile signals"
```

Expected: FAIL because the component still uses `md:right-20 md:top-[30%]`.

- [ ] **Step 3: Apply the confirmed B position without touching the mobile placement or dialog mapping**

Change only the `className` passed to the film `BrandSignal`:

```tsx
<BrandSignal
  ariaLabel="打开影视能力说明"
  className="hero-signal--film absolute left-4 top-24 z-10 md:left-auto md:right-[12%] md:top-[32%]"
  dividerClassName="rotate-[-20deg]"
  dividerPosition="after"
  label="专业影像"
  onClick={(event) => navigationRef.current?.openCapability('film', event.currentTarget)}
  value="FILM"
/>
```

Keep `ariaLabel="打开影视能力说明"`, `dividerClassName="rotate-[-20deg]"`, `dividerPosition="after"`, `label="专业影像"`, the `film` callback, and `value="FILM"` unchanged.

- [ ] **Step 4: Run the focused hero test and verify it passes**

Run:

```bash
pnpm --filter @gaoge/app-brand exec vitest run src/concepts/skiing/components/SkiingHero.test.tsx -t "uses linear mobile signals"
```

Expected: PASS.

- [ ] **Step 5: Check formatting and inspect only the files changed by this implementation**

Run:

```bash
pnpm exec prettier --check apps/brand/src/brand/components/BrandNavigation.tsx apps/brand/src/concepts/skiing/components/SkiingHero.tsx apps/brand/src/App.test.tsx apps/brand/src/concepts/skiing/components/SkiingHero.test.tsx
git diff --check -- apps/brand/src/brand/components/BrandNavigation.tsx apps/brand/src/concepts/skiing/components/SkiingHero.tsx apps/brand/src/App.test.tsx apps/brand/src/concepts/skiing/components/SkiingHero.test.tsx
```

Expected: Prettier reports all four files formatted and `git diff --check` prints no errors. Review the diff carefully so no pre-existing edits in these dirty files are overwritten.

- [ ] **Step 6: Run the Brand verification suite**

Run:

```bash
pnpm --filter @gaoge/app-brand typecheck
pnpm --filter @gaoge/app-brand test
pnpm --filter @gaoge/app-brand build
```

Expected: all three commands exit with code 0.

- [ ] **Step 7: Capture and inspect the required responsive screenshots**

Start the Brand dev server if it is not already running:

```bash
pnpm --filter @gaoge/app-brand dev
```

Capture desktop and mobile screenshots using the repository's installed Playwright binary:

```bash
pnpm --filter @gaoge/app-desktop exec playwright screenshot --viewport-size='1440,900' --wait-for-timeout=1500 http://127.0.0.1:5174/ /tmp/gaoge-brand-home-polish-desktop.png
pnpm --filter @gaoge/app-desktop exec playwright screenshot --viewport-size='390,844' --wait-for-timeout=1500 http://127.0.0.1:5174/ /tmp/gaoge-brand-home-polish-mobile-390.png
pnpm --filter @gaoge/app-desktop exec playwright screenshot --viewport-size='320,700' --wait-for-timeout=1500 http://127.0.0.1:5174/ /tmp/gaoge-brand-home-polish-mobile-320.png
```

Inspect all three screenshots. Confirm the desktop `FILM` signal is staggered left of `SPORTS` without crossing the white sleeve, the `G` is legible inside its unrotated circle, `集团` remains secondary, mobile signals retain their four-corner placement, and no viewport has horizontal overflow or header overlap. Also inspect the browser console for new errors.

- [ ] **Step 8: Run the frontend design pre-flight checks relevant to this targeted change**

Confirm:

- the homepage theme and accent color are unchanged;
- the group entry remains readable against the video at normal and hover states;
- desktop navigation remains on one line and below 80px tall;
- the visible strings `G`, `GAOGE`, `集团`, `FILM`, and `专业影像` are correct;
- no new motion, images, decorative labels, glows, or layout systems were introduced;
- existing focus styles and reduced-motion behavior remain intact.

- [ ] **Step 9: Check knowledge impact and hand off the exact source diff**

Call the knowledge-base `impact_for_changes` tool with repository `gaoge` and these paths:

```text
apps/brand/src/brand/components/BrandNavigation.tsx
apps/brand/src/concepts/skiing/components/SkiingHero.tsx
apps/brand/src/App.test.tsx
apps/brand/src/concepts/skiing/components/SkiingHero.test.tsx
```

Report the impacted knowledge pages, if any, and whether `kb-maintainer` follow-up is warranted. Do not commit the four dirty source/test files automatically; provide the verification results and precise changed paths so the user can decide how to group the existing work.
