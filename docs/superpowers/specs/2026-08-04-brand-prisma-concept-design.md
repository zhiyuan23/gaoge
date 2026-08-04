# Brand Prisma Concept Design

## Context

`apps/brand` hosts independent React visual concepts under `/concepts/*`. The
user supplied a complete implementation brief for a creative studio landing
page named Prisma and requested a strict reproduction inside the current brand
application.

## Goal

Implement the supplied Prisma landing page at `/concepts/prisma` without
rewriting its copy, replacing its remote media, changing the current default
route, or modifying the content of existing concepts.

## Scope

- React 18, TypeScript, Vite, Tailwind CSS 3, Framer Motion, and Lucide React
- Three sections in this order: Hero, About, Features
- The exact copy, video URLs, image URLs, palette, typography, layout,
  responsive rules, and animation timings supplied in the brief
- Almarai as the Prisma sans-serif and Instrument Serif Italic for the specified
  About heading segment
- A dedicated `/concepts/prisma` route
- Route and rendering coverage in the existing brand test suite

The current Securify default route and the Jack concept remain unchanged.

## File Boundaries

```text
apps/brand/
├── index.html
├── tailwind.config.ts
└── src/
    ├── App.tsx
    ├── App.test.tsx
    ├── styles.css
    └── concepts/
        └── prisma/
            ├── PrismaPage.tsx
            ├── data.ts
            ├── components/
            │   ├── AnimatedLetter.tsx
            │   ├── FeatureCard.tsx
            │   ├── ScrollRevealText.tsx
            │   ├── WordsPullUp.tsx
            │   └── WordsPullUpMultiStyle.tsx
            └── sections/
                ├── AboutSection.tsx
                ├── FeaturesSection.tsx
                └── HeroSection.tsx
```

All page-specific implementation stays inside `concepts/prisma`. Shared brand
configuration receives only the additions required to expose the route, fonts,
colors, and noise utilities.

## Page Behavior

### Hero

- Full viewport section with the supplied inset padding and rounded video frame
- Supplied autoplaying, looping, muted, inline video
- Noise and vertical gradient overlays
- Top-centered black navigation pill with the five supplied links
- Bottom 12-column composition containing animated `Prisma*`, the supplied
  description, and the `Join the lab` CTA
- Exact responsive typography, spacing, colors, and animation delays from the
  brief

### About

- Black section containing a centered `#101010` panel
- `Visual arts` label
- Three-segment animated heading using Almarai and Instrument Serif Italic as
  specified
- Supplied body paragraph with character-by-character opacity driven by
  Framer Motion `useScroll`

### Features

- Black full-height section with the supplied subtle noise layer
- Two-line animated heading
- Responsive one, two, and four-column card grid
- Supplied video card and three `#212121` checklist cards
- Exact image URLs, checklist copy, numbering, arrows, and card entrance timing

## Animation Components

- `WordsPullUp` splits text into words and reveals them from `y: 20` with
  `0.08s` staggering. It supports the Prisma asterisk treatment.
- `WordsPullUpMultiStyle` flattens styled text segments into per-word motion
  spans while preserving each segment class.
- `ScrollRevealText` owns the section scroll progress and delegates each
  character transform to `AnimatedLetter`.
- Feature cards enter once from `scale: 0.95` and `opacity: 0`, staggered by
  `0.15s`.
- Reduced-motion users receive the final visible state without staged motion.

## Styling

- Prisma uses pure black globally within its page, `#101010` for About, and
  `#212121` for feature cards.
- Primary foreground is `#E1E0CC`; Tailwind `primary` is `#DEDBC8`.
- Font resources are loaded in `index.html`, while font application is scoped
  to `.prisma-page` so existing concepts retain their typography.
- `.noise-overlay` and `.bg-noise` use the exact SVG turbulence settings from
  the brief.
- The page is responsive at the supplied Tailwind breakpoints and must not
  create horizontal overflow.

## Accessibility and Failure Behavior

- Videos are decorative, muted, non-interactive, and hidden from assistive
  technology.
- Navigation and calls to action remain keyboard focusable.
- Icons that duplicate visible text are decorative.
- Failed remote video or image loading leaves the section or card background
  intact and does not remove text content.
- `prefers-reduced-motion` disables staged entry and scroll-linked opacity while
  retaining all content.

## Verification

Run:

```bash
pnpm --filter @gaoge/app-brand test
pnpm --filter @gaoge/app-brand typecheck
pnpm --filter @gaoge/app-brand build
pnpm exec stylelint "apps/brand/src/**/*.{css,scss,vue}"
```

Inspect `/concepts/prisma` at desktop and mobile viewport sizes, confirming the
three-section order, responsive card columns, video coverage, typography,
animation, remote asset fallbacks, and absence of horizontal scrolling.
