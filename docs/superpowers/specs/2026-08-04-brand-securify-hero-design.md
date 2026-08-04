# Brand Securify Hero Design

## Context

`apps/brand` is a standalone React, Vite, and Tailwind CSS application that hosts
multiple visual concepts under dedicated routes. The existing Jack concept must
remain available while the new Securify data-security SaaS concept becomes the
default brand preview.

The supplied prompt is the approved visual specification. It explicitly defines
the page content, video asset, layout, responsive behavior, palette, typography,
and allowed interactions.

## Goal

Build a production-ready, full-screen Securify hero at
`/concepts/securify`, preserving the existing `/concepts/jack-3d` route and
redirecting unknown paths to the new Securify concept.

## Scope

### In scope

- A single full-viewport Securify hero page
- The supplied looping CloudFront background video
- A floating three-part navigation layout
- Three staggered display words: `protect`, `your`, and `data`
- The supplied description and three metric blocks
- Mobile behavior that hides the center navigation and diagonal dividers
- Readex Pro weights 300 through 700
- Route and component tests for the new concept
- Focus-visible behavior and decorative-video accessibility semantics

### Out of scope

- Additional landing-page sections
- Working destination pages for the navigation links
- Analytics, authentication, forms, or backend integration
- New animation libraries or entry animations
- Video download or local asset mirroring
- Shared cross-concept abstractions

## Architecture

The concept remains isolated inside the brand application:

```text
apps/brand/src/
├── App.tsx
├── App.test.tsx
├── styles.css
└── concepts/
    ├── jack-3d/
    └── securify/
        ├── SecurifyPage.tsx
        └── components/
            ├── SecurifyLogo.tsx
            ├── SecurifyNavbar.tsx
            ├── SecurifyStat.tsx
            └── SecurifyHero.tsx
```

The small component boundaries keep the logo, navigation, metric pattern, and
hero composition independently readable without creating a generic design
system. There is no state or data flow beyond static rendering and the browser's
native video playback.

## Visual Design

### Design read

The page is a B2B data-security SaaS hero for technical buyers and startups. It
uses a cinematic, editorial layout with high asymmetry, restrained motion, and
low information density.

- Design variance: 8
- Motion intensity: 3
- Visual density: 3

### Canvas and video

The hero occupies `h-screen w-full`, clips overflow, and uses pure black as its
fallback. The video fills the canvas with `object-cover`, autoplays, loops, is
muted, and plays inline. It is decorative and therefore hidden from assistive
technology.

### Navigation

The navigation is absolutely positioned at the top with a `z-20` stacking
context. The left brand pill and desktop center-link pill use neutral-900 at
90% opacity with backdrop blur. The white `get started` button is the only
filled call to action.

The center navigation is hidden below the medium breakpoint. Links retain the
prompt's lowercase labels and only transition their text color. The call to
action only transitions its background color.

### Typography and content

Readex Pro is loaded at weights 300, 400, 500, 600, and 700. The Securify
concept applies it locally so the existing Jack concept can retain Kanit.

The title words use the supplied absolute positions, viewport-relative sizes,
`-0.04em` tracking, and `0.95` line height. All visible text remains lowercase.
The supplied copy and mock metrics are reproduced verbatim because they are
part of the approved concept brief.

### Metrics and gradient

The top-right, bottom-left, and bottom-right metric blocks use the exact
positions and text hierarchy from the prompt. Their diagonal rules disappear
on mobile. A bottom black gradient improves contrast near the lower edge and
does not capture pointer input.

## Responsive Behavior

- Below `md`, the center navigation and all diagonal metric dividers are hidden.
- Navigation and edge offsets tighten from the desktop values to the supplied
  mobile values.
- Display typography remains fluid through `vw` units.
- The page intentionally remains a single clipped viewport rather than becoming
  vertically scrollable.
- No responsive change introduces additional content or motion.

## Accessibility and Failure Behavior

- The background video is decorative (`aria-hidden`) and does not expose
  controls or audio.
- Semantic navigation, headings, links, and button elements remain keyboard
  discoverable.
- Focus-visible outlines remain available from the brand application's global
  focus rules.
- If the remote video cannot load, the pure black section background remains
  visible and all foreground content stays usable.
- No alternate media asset is invented because the prompt supplies the canonical
  video URL.

## Routing

- `/concepts/securify` renders the new concept.
- `/concepts/jack-3d` continues to render the existing Jack concept.
- `/` and all unknown paths redirect to `/concepts/securify`.
- The Securify page updates `document.title` to `securify — data security`.

## Verification

Run:

```bash
pnpm --filter @gaoge/app-brand test
pnpm --filter @gaoge/app-brand typecheck
pnpm --filter @gaoge/app-brand build
```

Then inspect `/concepts/securify` at representative desktop and mobile viewport
sizes to confirm:

- The video covers the viewport.
- All three headline words and metric blocks match their intended placements.
- Desktop navigation and diagonal dividers disappear on mobile.
- No unintended purple or indigo color appears.
- The existing Jack route still renders.

## Default Assumptions

- The prompt is treated as the approved visual source of truth.
- The call-to-action button has no destination because none was supplied.
- The navigation anchors use matching fragment identifiers such as `#platform`;
  these remain future-facing until destination sections or pages exist.
- The video remains remote rather than being copied into the repository.
- The Securify concept becomes the brand application's default preview without
  deleting or modifying the Jack concept.
