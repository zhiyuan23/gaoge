# Brand Jack 3D Creator Concept Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. The user explicitly requested inline execution without sub-agents and without TDD. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a high-fidelity React implementation of the supplied “Jack -- 3D Creator” landing page at `/concepts/jack-3d` inside a new standalone `apps/brand` application.

**Architecture:** Create an independent React/Vite application with a lightweight pathname registry and a concept-local component tree. Keep all Jack-specific sections, reusable motion components, data, and styling inside `src/concepts/jack-3d`, while the app shell only selects the concept route and redirects `/`.

**Tech Stack:** React 18.3, TypeScript 5.9, Vite 6, Tailwind CSS 3.4, Framer Motion 12, Lucide React, Vitest, Testing Library, jsdom

## Global Constraints

- Do not use sub-agents.
- Do not use TDD; implement each coherent unit first, then add or run its verification.
- Preserve the supplied Jack copy, image URLs, section order, colors, dimensions, breakpoints, formulas, and animation timing.
- Render the concept at `/concepts/jack-3d`; redirect `/` and unmatched paths there.
- Keep concept code under `apps/brand/src/concepts/jack-3d`.
- Do not restore code from historical brand branches.
- Do not modify deployment, DNS, API, sports, admin, or other application behavior.
- Do not invent external destinations for Contact Me or Live Project controls.
- Honor `prefers-reduced-motion` without changing normal-mode effects.
- Run typecheck, tests, production build, root lint, and local visual checks before completion.

---

## Planned File Structure

```text
apps/brand/
├─ index.html                         # Document shell and page title
├─ package.json                       # App scripts and isolated dependencies
├─ postcss.config.cjs                 # Tailwind 3 PostCSS pipeline
├─ tailwind.config.ts                 # Concept source scanning and theme extensions
├─ tsconfig.json                      # React web TypeScript configuration
├─ vite.config.ts                     # Vite React and Vitest configuration
└─ src/
   ├─ App.test.tsx                    # Route and page composition verification
   ├─ App.tsx                         # Lightweight pathname registry and redirect
   ├─ main.tsx                        # React root
   ├─ setup-tests.ts                  # jest-dom and browser API test shims
   ├─ styles.css                      # Tailwind directives and global visual rules
   └─ concepts/
      └─ jack-3d/
         ├─ Jack3DCreatorPage.tsx     # Ordered page composition
         ├─ data.test.ts              # Dataset count and URL verification
         ├─ data.ts                   # Navigation, GIF, service, and project data
         ├─ types.ts                  # Readonly concept data types
         ├─ components/
         │  ├─ AnimatedText.tsx       # Character scroll reveal
         │  ├─ ContactButton.tsx      # Gradient contact pill
         │  ├─ FadeIn.tsx             # whileInView wrapper
         │  ├─ ImageWithFallback.tsx  # Stable remote-image fallback
         │  ├─ LiveProjectButton.tsx  # Outline project pill
         │  ├─ Magnet.tsx             # Pointer-follow transform
         │  └─ ProjectCard.tsx        # Sticky project stack card
         └─ sections/
            ├─ AboutSection.tsx
            ├─ HeroSection.tsx
            ├─ MarqueeSection.tsx
            ├─ ProjectsSection.tsx
            └─ ServicesSection.tsx
```

## Task 1: Scaffold the Standalone Brand App and Concept Route

**Files:**

- Create: `apps/brand/package.json`
- Create: `apps/brand/index.html`
- Create: `apps/brand/tsconfig.json`
- Create: `apps/brand/vite.config.ts`
- Create: `apps/brand/tailwind.config.ts`
- Create: `apps/brand/postcss.config.cjs`
- Create: `apps/brand/src/main.tsx`
- Create: `apps/brand/src/App.tsx`
- Create: `apps/brand/src/setup-tests.ts`
- Create: `apps/brand/src/styles.css`
- Create: `apps/brand/src/concepts/jack-3d/Jack3DCreatorPage.tsx`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

**Interfaces:**

- Produces: `Jack3DCreatorPage(): JSX.Element`
- Produces: local URL `http://localhost:<vite-port>/concepts/jack-3d`
- Consumes: no earlier task interfaces

- [ ] **Step 1: Add the brand workspace package and scripts**

  Define `dev`, `build`, `preview`, `test`, `typecheck`, and `clean`. Add React 18, React DOM 18, Framer Motion 12, Lucide React, React Router DOM, Tailwind 3, PostCSS, Autoprefixer, React Vite plugin, Testing Library, jsdom, TypeScript, Vite, and Vitest.

  Add root scripts:

  ```json
  {
    "dev:brand": "turbo run dev --filter=@gaoge/app-brand",
    "build:brand": "turbo run build --filter=@gaoge/app-brand"
  }
  ```

- [ ] **Step 2: Configure TypeScript, Vite, Tailwind, PostCSS, and tests**

  Use the shared web TypeScript config, `jsx: "react-jsx"`, `@/* -> ./src/*`, and test types. Configure Vite aliases and jsdom setup.

  Tailwind content paths:

  ```ts
  content: ['./index.html', './src/**/*.{ts,tsx}']
  ```

  Extend the theme with `fontFamily.kanit`, `colors.ink = '#0C0C0C'`, and `colors.mist = '#D7E2EA'`.

- [ ] **Step 3: Create the app entry and route registry**

  Use React Router with:

  ```tsx
  <Routes>
    <Route path="/concepts/jack-3d" element={<Jack3DCreatorPage />} />
    <Route path="*" element={<Navigate to="/concepts/jack-3d" replace />} />
  </Routes>
  ```

  Set `document.title = 'Jack -- 3D Creator'` from the concept page.

- [ ] **Step 4: Establish global styles**

  Import Kanit weights `300;400;500;600;700;800;900`, apply reset rules to `html`, `body`, `#root`, and define:

  ```css
  .hero-heading {
    background: linear-gradient(180deg, #646973 0%, #bbccd7 100%);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  ```

  Add focus-visible styling, image fallback styling, reduced-motion scroll behavior, and `overflow-x: clip`.

- [ ] **Step 5: Install dependencies and verify the shell**

  Run:

  ```bash
  pnpm install
  pnpm --filter @gaoge/app-brand typecheck
  pnpm --filter @gaoge/app-brand build
  ```

  Expected: the new workspace resolves, typecheck passes, and Vite emits `apps/brand/dist`.

- [ ] **Step 6: Commit the scaffold**

  ```bash
  git add package.json pnpm-lock.yaml apps/brand
  git commit -m "feat(brand): scaffold jack concept app"
  ```

## Task 2: Define Typed Data and Reusable Motion Components

**Files:**

- Create: `apps/brand/src/concepts/jack-3d/types.ts`
- Create: `apps/brand/src/concepts/jack-3d/data.ts`
- Create: `apps/brand/src/concepts/jack-3d/components/FadeIn.tsx`
- Create: `apps/brand/src/concepts/jack-3d/components/ContactButton.tsx`
- Create: `apps/brand/src/concepts/jack-3d/components/LiveProjectButton.tsx`
- Create: `apps/brand/src/concepts/jack-3d/components/ImageWithFallback.tsx`
- Create: `apps/brand/src/concepts/jack-3d/components/Magnet.tsx`
- Create: `apps/brand/src/concepts/jack-3d/components/AnimatedText.tsx`

**Interfaces:**

- Produces: `NavigationItem`, `ServiceItem`, `ProjectItem`, and `ProjectImageSet`
- Produces: `navigationItems`, `marqueeRows`, `services`, and `projects`
- Produces: `FadeIn`, `ContactButton`, `LiveProjectButton`, `ImageWithFallback`, `Magnet`, and `AnimatedText`
- Consumes: Framer Motion and React hooks configured in Task 1

- [ ] **Step 1: Add readonly concept types and exact datasets**

  Define:

  ```ts
  export interface NavigationItem {
    readonly label: string
    readonly targetId: string
  }

  export interface ServiceItem {
    readonly number: string
    readonly name: string
    readonly description: string
  }

  export interface ProjectItem {
    readonly number: string
    readonly category: string
    readonly name: string
    readonly images: readonly [string, string, string]
  }
  ```

  Copy all 21 GIF URLs, five service records, and three project records verbatim from the spec. Export tripled Marquee tracks separately from the 11-item and 10-item base rows so tests can verify source counts.

- [ ] **Step 2: Implement FadeIn and both pill buttons**

  `FadeIn` accepts:

  ```ts
  interface FadeInProps {
    readonly children: ReactNode
    readonly className?: string
    readonly delay?: number
    readonly duration?: number
    readonly x?: number
    readonly y?: number
    readonly as?: keyof JSX.IntrinsicElements
  }
  ```

  Use easing `[0.25, 0.1, 0.25, 1]` and the exact viewport settings. Use `useReducedMotion()` to render the final state immediately.

  Buttons render actual `<button type="button">` controls because no external destination was supplied.

- [ ] **Step 3: Implement stable remote-image fallback**

  `ImageWithFallback` accepts standard image attributes, records load failure locally, and swaps the image for an `aria-label`-free decorative fallback block or a labeled project fallback based on `alt`.

- [ ] **Step 4: Implement Magnet**

  Track the wrapper and magnetic child with refs. On pointer movement:

  ```ts
  const x = (event.clientX - centerX) / strength
  const y = (event.clientY - centerY) / strength
  ```

  Activate only inside the bounding rect expanded by `padding`. Apply `translate3d`, the supplied active/inactive transitions, and `will-change: transform`. Reset on pointer leave, blur, reduced motion, and unmount.

- [ ] **Step 5: Implement AnimatedText**

  Target the paragraph with:

  ```ts
  useScroll({
    target: containerRef,
    offset: ['start 0.8', 'end 0.2'],
  })
  ```

  Split text with `Array.from`, give each character a proportional input range, and render an invisible placeholder plus an absolute animated glyph. In reduced-motion mode, render a normal paragraph.

- [ ] **Step 6: Run focused typecheck and commit**

  ```bash
  pnpm --filter @gaoge/app-brand typecheck
  git add apps/brand/src/concepts/jack-3d
  git commit -m "feat(brand): add jack concept motion primitives"
  ```

## Task 3: Implement Hero, Marquee, and About

**Files:**

- Create: `apps/brand/src/concepts/jack-3d/sections/HeroSection.tsx`
- Create: `apps/brand/src/concepts/jack-3d/sections/MarqueeSection.tsx`
- Create: `apps/brand/src/concepts/jack-3d/sections/AboutSection.tsx`
- Modify: `apps/brand/src/concepts/jack-3d/Jack3DCreatorPage.tsx`

**Interfaces:**

- Consumes: Task 2 datasets and components
- Produces: `HeroSection`, `MarqueeSection`, and `AboutSection`
- Produces: section IDs `hero`, `about`, and `contact`

- [ ] **Step 1: Implement the full-screen Hero**

  Use the exact navigation typography and responsive spacing. Implement `scrollToSection(targetId)` with reduced-motion-aware behavior. Compose the giant heading, magnetic portrait, bottom-left copy, and contact control with the exact FadeIn delays.

- [ ] **Step 2: Implement the two-row scroll Marquee**

  Use a section ref, two track refs, one passive scroll listener, and one scheduled animation frame:

  ```ts
  const offset = (window.scrollY - sectionTop + window.innerHeight) * 0.3
  rowOne.style.transform = `translate3d(${offset - 200}px, 0, 0)`
  rowTwo.style.transform = `translate3d(${-1 * (offset - 200)}px, 0, 0)`
  ```

  Render 420 × 270 tiles, 12px gaps, lazy loading, async decoding, and three copies per row. Freeze both transforms in reduced-motion mode.

- [ ] **Step 3: Implement About**

  Position all four decorative assets with the supplied widths and percentages. Add the gradient title, exact animated paragraph, and Contact button with the supplied vertical gaps and FadeIn directions.

- [ ] **Step 4: Compose and verify the first three sections**

  Render Hero, Marquee, and About in order from `Jack3DCreatorPage`.

  Run:

  ```bash
  pnpm --filter @gaoge/app-brand typecheck
  pnpm --filter @gaoge/app-brand build
  ```

- [ ] **Step 5: Commit the upper page**

  ```bash
  git add apps/brand/src/concepts/jack-3d
  git commit -m "feat(brand): build jack hero marquee and about"
  ```

## Task 4: Implement Services and Sticky Project Stack

**Files:**

- Create: `apps/brand/src/concepts/jack-3d/sections/ServicesSection.tsx`
- Create: `apps/brand/src/concepts/jack-3d/sections/ProjectsSection.tsx`
- Create: `apps/brand/src/concepts/jack-3d/components/ProjectCard.tsx`
- Modify: `apps/brand/src/concepts/jack-3d/Jack3DCreatorPage.tsx`

**Interfaces:**

- Consumes: `services`, `projects`, `FadeIn`, `LiveProjectButton`, and `ImageWithFallback`
- Produces: `ServicesSection`, `ProjectsSection`, and `ProjectCard`
- Produces: section IDs `services` and `projects`

- [ ] **Step 1: Implement Services**

  Render the white rounded panel, centered `SERVICES` heading, and five bordered list items. Use the exact number, title, and description `clamp()` values and `index * 0.1` delays.

- [ ] **Step 2: Implement ProjectCard scroll transforms**

  Each card owns a ref and calls:

  ```ts
  const { scrollYProgress } = useScroll({
    target: cardContainerRef,
    offset: ['start end', 'end start'],
  })
  const scale = useTransform(scrollYProgress, [0, 1], [1, targetScale])
  ```

  Compute:

  ```ts
  const targetScale = 1 - (total - 1 - index) * 0.03
  const stickyOffset = index * 28
  ```

  Disable scale in reduced-motion mode while retaining sticky order.

- [ ] **Step 3: Build exact card content and responsive image grid**

  Render the top metadata row, outline Live Project button, and the 40%/60% image grid. Preserve the supplied responsive radii, borders, padding, and height clamps. On narrow screens stack metadata and maintain all three images.

- [ ] **Step 4: Compose the complete page**

  Append Services and Projects to `Jack3DCreatorPage` in the fixed order. Ensure Services exposes `id="services"` for Price navigation and Projects exposes `id="projects"`.

- [ ] **Step 5: Run checks and commit**

  ```bash
  pnpm --filter @gaoge/app-brand typecheck
  pnpm --filter @gaoge/app-brand build
  git add apps/brand/src/concepts/jack-3d
  git commit -m "feat(brand): add jack services and project stack"
  ```

## Task 5: Add Post-Implementation Tests

**Files:**

- Create: `apps/brand/src/App.test.tsx`
- Create: `apps/brand/src/concepts/jack-3d/data.test.ts`
- Modify: `apps/brand/src/setup-tests.ts`

**Interfaces:**

- Consumes: the completed application and exported source datasets
- Produces: regression coverage for route, structure, copy, counts, links, and reduced-motion behavior

- [ ] **Step 1: Add route and composition tests**

  Render with `MemoryRouter initialEntries={['/concepts/jack-3d']}` and assert:

  ```ts
  expect(screen.getByRole('heading', { name: /hi, i'm jack/i })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: /about me/i })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: /services/i })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: /project/i })).toBeInTheDocument()
  ```

  Verify DOM order using `compareDocumentPosition`.

- [ ] **Step 2: Add dataset tests**

  Assert:

  ```ts
  expect(marqueeRowOne).toHaveLength(11)
  expect(marqueeRowTwo).toHaveLength(10)
  expect(services).toHaveLength(5)
  expect(projects).toHaveLength(3)
  ```

  Verify every project has three non-empty image URLs and that all navigation targets resolve to rendered IDs.

- [ ] **Step 3: Add browser API shims and reduced-motion coverage**

  Provide deterministic `matchMedia`, `ResizeObserver`, `IntersectionObserver`, `requestAnimationFrame`, and `scrollTo` shims. Set reduced motion to true in one test and assert the page still exposes all section content.

- [ ] **Step 4: Run app tests, typecheck, and build**

  ```bash
  pnpm --filter @gaoge/app-brand test
  pnpm --filter @gaoge/app-brand typecheck
  pnpm --filter @gaoge/app-brand build
  ```

- [ ] **Step 5: Commit tests**

  ```bash
  git add apps/brand/src
  git commit -m "test(brand): verify jack concept page"
  ```

## Task 6: Visual QA, Repository Verification, and Documentation Alignment

**Files:**

- Modify: `AGENTS.md`
- Modify: `README.md`
- Modify: `docs/conventions/frontend-styling.md`
- Modify: `docs/conventions/testing-and-verification.md`

**Interfaces:**

- Consumes: completed `@gaoge/app-brand`
- Produces: verified local URL and repository-level documentation consistent with the real application

- [ ] **Step 1: Start the local brand server**

  Run:

  ```bash
  pnpm dev:brand -- --host 127.0.0.1
  ```

  Open `/concepts/jack-3d` in the in-app browser.

- [ ] **Step 2: Inspect desktop layout at 1440 × 900**

  Verify Hero layering, title scale, portrait position, Marquee directions, About decorations, Services transition, sticky card stack, image cropping, focus states, and absence of horizontal scrolling.

- [ ] **Step 3: Inspect mobile layout at 390 × 844**

  Verify the portrait remains centered, giant title crops intentionally, navigation remains usable, project content stays readable, and all images remain within the viewport.

- [ ] **Step 4: Inspect reduced motion and remote-image failure**

  Emulate reduced motion and confirm the page is fully readable without transforms. Block one image request and confirm the fallback retains tile/card dimensions without a broken-image icon.

- [ ] **Step 5: Fix only issues that affect the confirmed concept**

  Keep fixes inside `apps/brand` unless repository documentation must reflect the real application or new root scripts. Re-run app checks after any fix.

- [ ] **Step 6: Register the real brand app in repository documentation**

  Update:
  - `AGENTS.md`: add `apps/brand` to the current application list, current-stage summary, independent workflow list, and common commands.
  - `README.md`: add the React/Vite/Tailwind/Framer brand app to the application matrix, directory overview, app command section, and root command table.
  - `docs/conventions/frontend-styling.md`: record that `apps/brand` uses React and Tailwind CSS, with concept-local styles and components.
  - `docs/conventions/testing-and-verification.md`: add the brand app’s typecheck, test, and build commands plus local route visual verification.

- [ ] **Step 7: Run final repository verification**

  ```bash
  pnpm --filter @gaoge/app-brand test
  pnpm --filter @gaoge/app-brand typecheck
  pnpm --filter @gaoge/app-brand build
  pnpm lint
  ```

  Expected: all commands exit 0.

- [ ] **Step 8: Check knowledge impact**

  Call `impact_for_changes` with every changed repository-relative path. Record whether the knowledge base needs follow-up; do not write knowledge pages from this workflow.

- [ ] **Step 9: Commit final polish and documentation**

  ```bash
  git add AGENTS.md README.md docs/conventions apps/brand package.json pnpm-lock.yaml
  git commit -m "docs(brand): register jack concept workflow"
  ```

  This commit is required because the new real application must be reflected in repository documentation.
