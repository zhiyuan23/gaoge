# Brand Securify Hero Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a production-ready Securify data-security SaaS hero concept to
`apps/brand` and make it the application's default preview without removing the
existing Jack concept.

**Architecture:** Keep the concept isolated under
`apps/brand/src/concepts/securify`, split into a page shell, hero composition,
navigation, reusable stat block, and logo. Route it through the existing
React Router application and use concept-scoped styling so Readex Pro and the
black/white palette do not change the existing Jack page.

**Tech Stack:** React 18, TypeScript 5, React Router 6, Vite 6, Tailwind CSS 3,
Vitest, Testing Library

## Global Constraints

- The canonical route is `/concepts/securify`.
- Preserve `/concepts/jack-3d`.
- Redirect `/` and unknown paths to `/concepts/securify`.
- Use the supplied CloudFront MP4 as the full-screen looping background.
- Load Readex Pro weights 300, 400, 500, 600, and 700.
- Keep every visible string lowercase.
- Use only black, white, neutral-900, and white opacity variants.
- Hide center navigation links and diagonal stat dividers below `md`.
- Limit transitions to nav-link text color and call-to-action background color.
- Do not add dependencies, backend behavior, analytics, or additional sections.
- Keep the supplied description and metric values verbatim.

---

### Task 1: Build the isolated Securify concept

**Files:**

- Create: `apps/brand/src/concepts/securify/components/SecurifyLogo.tsx`
- Create: `apps/brand/src/concepts/securify/components/SecurifyNavbar.tsx`
- Create: `apps/brand/src/concepts/securify/components/SecurifyStat.tsx`
- Create: `apps/brand/src/concepts/securify/components/SecurifyHero.tsx`
- Create: `apps/brand/src/concepts/securify/SecurifyPage.tsx`
- Modify: `apps/brand/src/styles.css`
- Modify: `apps/brand/tailwind.config.ts`

**Interfaces:**

- `SecurifyLogo(): JSX.Element` renders the supplied white 256 × 256 SVG mark.
- `SecurifyStat(props: SecurifyStatProps): JSX.Element` accepts:

```ts
interface SecurifyStatProps {
  readonly className: string
  readonly dividerClassName: string
  readonly dividerPosition: 'before' | 'after'
  readonly label: string
  readonly number: string
}
```

- `SecurifyNavbar(): JSX.Element` renders the brand pill, desktop link pill,
  and `get started` button.
- `SecurifyHero(): JSX.Element` owns the section, video, foreground
  typography, gradient, and all three stat placements.
- `SecurifyPage(): JSX.Element` updates document metadata and renders the hero.

- [ ] **Step 1: Add concept-local font and title styling**

Update the Google Fonts import so both existing Kanit and new Readex Pro are
available:

```css
@import 'https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700;800;900&family=Readex+Pro:wght@300;400;500;600;700&display=swap';
```

Keep the existing Jack globals intact, add `height: 100%` to `html`, `body`, and
`#root`, and add:

```css
.securify-page {
  min-width: 320px;
  background: #000;
  color: #fff;
  font-family:
    'Readex Pro',
    system-ui,
    -apple-system,
    sans-serif;
  -webkit-font-smoothing: antialiased;
}

.securify-page .hero-title {
  letter-spacing: -0.04em;
  line-height: 0.95;
}
```

Extend Tailwind's `fontFamily` with:

```ts
readex: ['Readex Pro', 'system-ui', '-apple-system', 'sans-serif']
```

- [ ] **Step 2: Implement the supplied logo and navigation**

Render the exact path in a `viewBox="0 0 256 256"` SVG with
`className="h-5 w-5"` and `fill="#ffffff"`.

Build the navbar with:

```tsx
const links = ['platform', 'solutions', 'company', 'support'] as const
```

Each link must use `href={`#${link}`}` and the exact desktop pill utilities
from the brief. The navigation wrapper uses
`absolute left-0 right-0 top-0 z-20 px-6 pt-6 md:px-10`.

- [ ] **Step 3: Implement the reusable stat renderer**

Render a wrapper whose position comes from `className`, a flex row containing
the divider before or after the number according to `dividerPosition`, and a
label below. Use:

```tsx
<p className="text-4xl font-medium tracking-tight md:text-5xl">{number}</p>
<p
  className={`mt-1 text-xs text-white/70 md:text-sm ${
    dividerPosition === 'before' ? 'text-right' : ''
  }`}
>
  {label}
</p>
```

The divider always includes `hidden h-px w-24 bg-white/40 md:block` plus the
supplied rotation class.

- [ ] **Step 4: Compose the full-screen hero**

Use the exact section and video behavior:

```tsx
<section className="relative h-screen w-full overflow-hidden bg-black">
  <video
    aria-hidden="true"
    autoPlay
    className="absolute inset-0 h-full w-full object-cover"
    loop
    muted
    playsInline
    src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260418_063509_7d167302-4fd4-480b-8260-18ab572333d4.mp4"
  />
  <SecurifyNavbar />
  <div className="relative z-10 h-full w-full">...</div>
</section>
```

Inside the foreground wrapper, reproduce every title, copy block, stat
position, and bottom gradient from the supplied brief. The gradient must precede
interactive foreground elements in stacking order or use `z-0`, while content
uses `z-10`, so it never dims the lower typography unexpectedly.

- [ ] **Step 5: Add the page shell and verify the focused build**

`SecurifyPage` sets:

```ts
document.title = 'securify — data security'
```

and renders:

```tsx
<main className="securify-page h-full bg-black text-white">
  <SecurifyHero />
</main>
```

Run:

```bash
pnpm --filter @gaoge/app-brand typecheck
pnpm --filter @gaoge/app-brand build
```

Expected: both commands exit successfully and Vite emits `apps/brand/dist`.

- [ ] **Step 6: Commit the isolated concept**

```bash
git add apps/brand/src/concepts/securify apps/brand/src/styles.css apps/brand/tailwind.config.ts
git commit -m "feat(brand): add securify hero concept"
```

---

### Task 2: Route and verify the Securify concept

**Files:**

- Modify: `apps/brand/src/App.tsx`
- Modify: `apps/brand/src/App.test.tsx`
- Modify: `apps/brand/index.html`

**Interfaces:**

- Consumes: the default export `SecurifyPage` from
  `@/concepts/securify/SecurifyPage`.
- Produces: a public `/concepts/securify` route and root fallback redirect.

- [ ] **Step 1: Register the route and default redirect**

Update `App.tsx` to render:

```tsx
<Routes>
  <Route path="/concepts/securify" element={<SecurifyPage />} />
  <Route path="/concepts/jack-3d" element={<Jack3DCreatorPage />} />
  <Route path="*" element={<Navigate to="/concepts/securify" replace />} />
</Routes>
```

- [ ] **Step 2: Update static document defaults**

Set the HTML title to `securify — data security` and the description to
`securify protects your data with privacy everywhere.` Runtime page components
remain responsible for route-specific titles.

- [ ] **Step 3: Add route and content assertions**

Refactor the test helper to accept any route and add a Securify suite that
asserts:

- `/concepts/securify` renders `protect`, `your`, and `data` headings.
- `securify`, `get started`, all four nav links, and all three metric labels are
  visible.
- The video has the exact supplied `src`, and has `autoplay`, `loop`, `muted`,
  and `playsinline` behavior.
- `/` redirects to the Securify concept.
- `/concepts/jack-3d` still renders the Jack heading and its five sections.

- [ ] **Step 4: Run the complete app verification**

Run:

```bash
pnpm --filter @gaoge/app-brand test
pnpm --filter @gaoge/app-brand typecheck
pnpm --filter @gaoge/app-brand build
```

Expected: Vitest passes all brand tests, TypeScript reports no errors, and the
production build completes.

- [ ] **Step 5: Commit routing and tests**

```bash
git add apps/brand/src/App.tsx apps/brand/src/App.test.tsx apps/brand/index.html
git commit -m "test(brand): verify securify concept route"
```

---

### Task 3: Visual QA and repository impact check

**Files:**

- Modify only if a visual defect is found: files changed in Tasks 1 and 2

**Interfaces:**

- Consumes: the production-ready `/concepts/securify` route.
- Produces: verified desktop and mobile layout evidence.

- [ ] **Step 1: Start the brand development server**

Run:

```bash
pnpm --filter @gaoge/app-brand dev -- --host 127.0.0.1
```

Open `/concepts/securify`.

- [ ] **Step 2: Inspect desktop and mobile viewports**

At approximately 1440 × 900, verify the center nav and diagonal dividers are
visible, all headline words remain within the viewport, the video covers the
screen, and only the requested neutral palette is present.

At approximately 390 × 844, verify the center nav and diagonal dividers are
hidden, the brand and call-to-action remain on one row, and the staggered
typography and three stat blocks remain legible.

- [ ] **Step 3: Re-run verification after any visual correction**

Run:

```bash
pnpm --filter @gaoge/app-brand test
pnpm --filter @gaoge/app-brand typecheck
pnpm --filter @gaoge/app-brand build
```

Expected: all commands exit successfully after the final source state.

- [ ] **Step 4: Check knowledge-base impact**

Call `impact_for_changes` with the final repository-relative changed paths.
Because the knowledge base does not currently register `apps/brand`, report the
gap rather than inventing a knowledge update.

- [ ] **Step 5: Confirm a clean scoped diff**

Run:

```bash
git status --short
git diff --check
```

Expected: no whitespace errors and no unrelated application changes.
