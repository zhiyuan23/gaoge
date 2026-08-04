# Brand Prisma Concept Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reproduce the supplied Prisma creative-studio landing page at
`/concepts/prisma` inside `apps/brand`.

**Architecture:** Keep all sections, data, and animation primitives private to
`src/concepts/prisma`. Modify shared brand files only to load the specified
fonts, expose Tailwind tokens, register the route, and add the two supplied
noise utilities.

**Tech Stack:** React 18, TypeScript, Vite 6, Tailwind CSS 3, Framer Motion 12,
Lucide React, Vitest, Testing Library

## Global Constraints

- Treat the supplied prompt as the sole visual and content source of truth.
- Preserve all supplied text and remote media URLs.
- Keep `/concepts/securify` as the default route.
- Do not alter the content or internal behavior of existing concepts.
- Place Prisma implementation files under `apps/brand/src/concepts/prisma`.
- Preserve existing uncommitted user changes.

---

### Task 1: Route and theme foundation

**Files:**

- Modify: `apps/brand/index.html`
- Modify: `apps/brand/tailwind.config.ts`
- Modify: `apps/brand/src/styles.css`
- Modify: `apps/brand/src/App.tsx`
- Modify: `apps/brand/src/App.test.tsx`
- Create: `apps/brand/src/concepts/prisma/PrismaPage.tsx`

**Interfaces:**

- Produces: default React component `PrismaPage`
- Produces: route `/concepts/prisma`
- Produces: Tailwind tokens `primary` and `font-serif`
- Produces: `.prisma-page`, `.noise-overlay`, and `.bg-noise`

- [x] **Step 1: Add a route rendering test**

Add a Prisma suite to `App.test.tsx` that renders `/concepts/prisma`, asserts
the `Prisma` heading, `Visual arts` label, Features heading, and three main
sections, and confirms the existing default redirect still targets Securify.

- [x] **Step 2: Run the route test and confirm it fails**

Run:

```bash
pnpm --filter @gaoge/app-brand test -- src/App.test.tsx
```

Expected: failure because the Prisma route and page do not exist.

- [x] **Step 3: Add the route and page shell**

Create `PrismaPage.tsx` with a page-local body class and title:

```tsx
useEffect(() => {
  document.title = 'Prisma - creative studio'
  document.body.classList.add('prisma-active')

  return () => document.body.classList.remove('prisma-active')
}, [])
```

Render a `main.prisma-page` containing the three section components. Register it
in `App.tsx` without changing the wildcard redirect.

- [x] **Step 4: Add fonts and theme utilities**

Load Almarai weights 300, 400, 700, 800 and Instrument Serif Italic in
`index.html`. Extend Tailwind with:

```ts
colors: {
  primary: '#DEDBC8',
}
fontFamily: {
  serif: ['"Instrument Serif"', 'serif'],
}
```

Scope Almarai to `.prisma-page` and add the two SVG turbulence data URI
utilities with the exact frequencies and octave counts from the brief.

---

### Task 2: Shared Prisma data and animation primitives

**Files:**

- Create: `apps/brand/src/concepts/prisma/data.ts`
- Create: `apps/brand/src/concepts/prisma/components/WordsPullUp.tsx`
- Create: `apps/brand/src/concepts/prisma/components/WordsPullUpMultiStyle.tsx`
- Create: `apps/brand/src/concepts/prisma/components/AnimatedLetter.tsx`
- Create: `apps/brand/src/concepts/prisma/components/ScrollRevealText.tsx`

**Interfaces:**

- Produces: `navigationItems`, `featureCards`, `aboutBody`
- Produces:
  `WordsPullUp({ text, className?, showAsterisk?, as?, ariaLabel? })`
- Produces:
  `WordsPullUpMultiStyle({ segments, className?, ariaLabel?, align? })`
- Produces: `ScrollRevealText({ text, className? })`

- [x] **Step 1: Define exact content data**

Store the five navigation labels, About body copy, three feature-card titles,
numbers, image URLs, and checklist items in typed readonly arrays. Do not
rewrite any supplied string.

- [x] **Step 2: Implement word pull-up components**

Use `useRef`, `useInView`, `motion.span`, and `useReducedMotion`. Reveal each word
from `{ y: 20, opacity: 0 }` to `{ y: 0, opacity: 1 }` with `index * 0.08`
delay. `WordsPullUp` adds the asterisk only to the final word when requested.
`WordsPullUpMultiStyle` preserves each segment's class on every generated word.

- [x] **Step 3: Implement character reveal**

`ScrollRevealText` owns:

```ts
useScroll({
  target: ref,
  offset: ['start 0.8', 'end 0.2'],
})
```

Each `AnimatedLetter` maps its assigned range from opacity `0.2` to `1`.
Reduced-motion mode renders opacity `1` for every character.

---

### Task 3: Hero and About sections

**Files:**

- Create: `apps/brand/src/concepts/prisma/sections/HeroSection.tsx`
- Create: `apps/brand/src/concepts/prisma/sections/AboutSection.tsx`
- Modify: `apps/brand/src/concepts/prisma/PrismaPage.tsx`

**Interfaces:**

- Consumes: `navigationItems`, `aboutBody`, `WordsPullUp`,
  `WordsPullUpMultiStyle`, `ScrollRevealText`
- Produces: `HeroSection`, `AboutSection`

- [x] **Step 1: Build the Hero**

Use the exact supplied CloudFront video, inset padding, rounded frame, overlays,
navigation pill, 12-column bottom composition, giant `Prisma*` text,
description, and CTA. Use Lucide `ArrowRight` with `strokeWidth={1.75}`.

- [x] **Step 2: Build the About section**

Create the `#101010` centered card, `Visual arts` label, the exact three styled
heading segments, and scroll-linked body paragraph. Apply Instrument Serif only
to `a self-taught director.` and keep its italic descenders unclipped.

- [x] **Step 3: Run focused tests**

Run:

```bash
pnpm --filter @gaoge/app-brand test -- src/App.test.tsx
```

Expected: Prisma route assertions pass and existing route coverage remains
green.

---

### Task 4: Features section and full verification

**Files:**

- Create: `apps/brand/src/concepts/prisma/components/FeatureCard.tsx`
- Create: `apps/brand/src/concepts/prisma/sections/FeaturesSection.tsx`
- Modify: `apps/brand/src/concepts/prisma/PrismaPage.tsx`

**Interfaces:**

- Consumes: `featureCards`, `WordsPullUpMultiStyle`
- Produces: `FeatureCard`, `FeaturesSection`

- [x] **Step 1: Implement the feature card**

Render the supplied icon image, numbered title, checklist with Lucide `Check`,
and `Learn more` link with a rotated Lucide `ArrowRight`. Use an image-error
handler that hides the failed image while preserving its `#212121` container.

- [x] **Step 2: Implement the Features composition**

Create the supplied two-line heading, noise background, video card, and three
data-driven cards. Use one, two, and four columns at the supplied breakpoints.
Cards enter from `scale: 0.95` and `opacity: 0`, staggered by `0.15s`.

- [x] **Step 3: Run automated verification**

Run:

```bash
pnpm --filter @gaoge/app-brand test
pnpm --filter @gaoge/app-brand typecheck
pnpm --filter @gaoge/app-brand build
pnpm exec stylelint "apps/brand/src/**/*.{css,scss,vue}"
```

Expected: every command exits successfully.

- [x] **Step 4: Run browser checks**

Inspect `/concepts/prisma` at desktop and mobile widths. Confirm all three
sections, exact copy, asset coverage, animated states, one/two/four-column card
behavior, reduced-motion visibility, and no horizontal overflow.

- [x] **Step 5: Review change impact**

Call knowledge-base `impact_for_changes` with the changed repository-relative
paths and report whether project knowledge requires maintenance.
