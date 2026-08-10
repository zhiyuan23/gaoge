# Gaoge Content Operating Matrix Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `apps/brand` `/content` in the same parent-brand system as `/digital`, while preserving its warm-red editorial imagery and focusing on current content properties, platform coverage, and the operating loop.

**Architecture:** Keep `ContentPage.tsx` as a thin composition root and add page-private components for navigation, hero, current content, platforms, operating loop, and section reveal. Extend the shared `BrandNavigation` only with a content-specific branch; keep content data in `pages/content/data.ts` and do not make content components depend on digital components.

**Tech Stack:** React 19, React Router, TypeScript, Tailwind CSS v3, project CSS, Framer Motion, Vitest, Testing Library, built-in ImageGen.

## Global Constraints

- Preserve `/content`, existing metadata title, footer links, and the confirmed `https://sports.gaoge.cc` destination.
- Do not add future plans, remote APIs, CMS behavior, search, filters, pagination, new dependencies, unconfirmed links, or fabricated metrics.
- Keep content status labels as `运营中`, `建设中`, and `规划中`; do not reuse digital's `演示系统` wording.
- Desktop navigation labels are `概览 / 当前内容 / 平台矩阵 / 运营闭环`; mobile labels are `概览 / 内容 / 平台 / 运营` and align right.
- Stable section IDs are `content-overview`, `content-properties`, `content-platforms`, and `content-loop`.
- Use one dark theme and one low-saturation warm-red accent across the page.
- Cards use the existing soft `24px` radius family; interactive controls may remain pill-shaped.
- Use only transform and opacity for animation, with `bounce: 0`, response around `0.35-0.45s`, and `useReducedMotion()` fallbacks.
- Remove the remote autoplay background video from the content hero.
- Do not render fake platform interfaces, fake screenshots, decorative section numbers, progress bars, or continuous animations.
- Support 320px and larger without page-level horizontal scrolling.

---

## File Map

**Create**

- `apps/brand/public/assets/brand/content-league-atmosphere.jpg`: generated supporting image for 高歌超级联赛.
- `apps/brand/public/assets/brand/content-creator-practice.jpg`: generated supporting image for 主理人个人 IP.
- `apps/brand/src/pages/content/components/ContentSectionNavigation.tsx`: observes content sections and renders responsive labels.
- `apps/brand/src/pages/content/components/ContentHero.tsx`: split hero with brand copy and real imagery.
- `apps/brand/src/pages/content/components/CurrentContent.tsx`: asymmetric current-content composition.
- `apps/brand/src/pages/content/components/ContentPlatforms.tsx`: platform coverage surface.
- `apps/brand/src/pages/content/components/ContentOperatingLoop.tsx`: six-stage operating path.
- `apps/brand/src/pages/content/components/ContentSectionReveal.tsx`: one-time reveal with reduced-motion fallback.
- `apps/brand/src/pages/content/components/ContentSectionReveal.test.tsx`: reveal behavior contract.

**Modify**

- `apps/brand/src/pages/content/data.ts`: assign confirmed local supporting visuals to the two secondary properties.
- `apps/brand/src/pages/content/data.test.ts`: verify the asset and link contracts.
- `apps/brand/src/pages/content/ContentPage.tsx`: replace the legacy page body with the new sections.
- `apps/brand/src/brand/components/BrandNavigation.tsx`: make content use the shared floating navigation surface and its own section navigation.
- `apps/brand/src/brand/components/BrandPageShell.tsx`: use horizontal clipping for content like digital and group.
- `apps/brand/src/App.test.tsx`: verify content sections, navigation, links, statuses, and copy.
- `apps/brand/src/styles.css`: add content materials, responsive layouts, and accessibility fallbacks.

**Leave in place but stop rendering**

- `apps/brand/src/pages/content/components/ContentPropertyBlock.tsx`
- `apps/brand/src/pages/content/components/PlatformRail.tsx`

---

### Task 1: Generate and register supporting content imagery

**Files:**

- Create: `apps/brand/public/assets/brand/content-league-atmosphere.jpg`
- Create: `apps/brand/public/assets/brand/content-creator-practice.jpg`
- Modify: `apps/brand/src/pages/content/data.ts`
- Test: `apps/brand/src/pages/content/data.test.ts`

**Interfaces:**

- Consumes: existing `ContentProperty.visual?: { alt: string; src: string }`.
- Produces: all three current content properties with explicit local visuals; link behavior remains unchanged.

- [ ] **Step 1: Add failing visual-contract assertions**

Add to `data.test.ts`:

```ts
it('assigns a local visual to every current content property', () => {
  contentProperties.forEach((property) => {
    expect(property.visual?.src).toMatch(/^\/assets\/brand\/.+\.(jpg|webp)$/)
    expect(property.visual?.alt).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run the data test and confirm the missing visuals fail**

Run:

```bash
pnpm --filter @gaoge/app-brand test -- src/pages/content/data.test.ts
```

Expected: FAIL because 高歌超级联赛 and 主理人个人 IP have no `visual`.

- [ ] **Step 3: Generate two raster assets with built-in ImageGen**

Generate `content-league-atmosphere.jpg` with this direction:

```text
Wide 4:3 editorial sports photograph for a premium Chinese sports-content brand. Night amateur football match under stadium floodlights, players and spectators seen as energetic silhouettes, subtle warm red practical light, charcoal blacks, authentic documentary atmosphere, restrained cinematic grain, no logos, no readable text, no UI, no watermark.
```

Generate `content-creator-practice.jpg` with this direction:

```text
Wide 4:3 editorial photograph of a Chinese creative founder working between sports, content, and product practice. Close crop of hands, notebook, camera, and laptop edge on a dark studio table, subtle warm red light, charcoal blacks, honest documentary mood, no visible screen interface, no readable text, no logos, no watermark.
```

Use ImageGen's generated source files, convert to JPEG quality around 82 if necessary, and place them at the exact paths listed above. Confirm dimensions with `sips -g pixelWidth -g pixelHeight`.

- [ ] **Step 4: Register the generated visuals**

Update the secondary properties in `data.ts`:

```ts
visual: {
  alt: '夜间球场灯光下进行的高歌超级联赛',
  src: '/assets/brand/content-league-atmosphere.jpg',
},
```

```ts
visual: {
  alt: '桌面上的相机、笔记与内容创作工具',
  src: '/assets/brand/content-creator-practice.jpg',
},
```

- [ ] **Step 5: Run data tests and formatting checks**

Run:

```bash
pnpm --filter @gaoge/app-brand test -- src/pages/content/data.test.ts
pnpm exec prettier --check "apps/brand/src/pages/content/**/*.{ts,tsx}"
```

Expected: PASS.

- [ ] **Step 6: Commit the asset contract**

```bash
git add apps/brand/public/assets/brand/content-league-atmosphere.jpg apps/brand/public/assets/brand/content-creator-practice.jpg apps/brand/src/pages/content/data.ts apps/brand/src/pages/content/data.test.ts
git commit -m "feat(brand): add content matrix imagery"
```

### Task 2: Add the content section navigation

**Files:**

- Create: `apps/brand/src/pages/content/components/ContentSectionNavigation.tsx`
- Modify: `apps/brand/src/brand/components/BrandNavigation.tsx`
- Modify: `apps/brand/src/brand/components/BrandPageShell.tsx`
- Test: `apps/brand/src/App.test.tsx`

**Interfaces:**

- Consumes: stable content section IDs defined in Global Constraints.
- Produces: `ContentSectionNavigation(): JSX.Element`; `BrandNavigation` uses it when `current === 'content'`.

- [ ] **Step 1: Add failing route assertions for the content section navigation**

Inside the `/content` route test, add:

```ts
const sectionNavigation = screen.getByLabelText('内容页面章节')
const sectionDestinations = [
  ['概览', '概览', '#content-overview'],
  ['当前内容', '内容', '#content-properties'],
  ['平台矩阵', '平台', '#content-platforms'],
  ['运营闭环', '运营', '#content-loop'],
] as const

sectionDestinations.forEach(([label, mobileLabel, href]) => {
  const link = within(sectionNavigation).getByRole('link', { name: label })
  expect(link).toHaveAttribute('href', href)
  expect(within(link).getByText(mobileLabel, { selector: '.md\\:hidden' })).toBeInTheDocument()
})
expect(within(screen.getByLabelText('高歌品牌导航')).getByText('内容')).toBeInTheDocument()
```

- [ ] **Step 2: Run the route test and confirm the navigation is missing**

Run:

```bash
pnpm --filter @gaoge/app-brand test -- src/App.test.tsx
```

Expected: FAIL because `内容页面章节` does not exist.

- [ ] **Step 3: Implement `ContentSectionNavigation`**

Use the same observer mechanics as digital but define content-private labels and selectors:

```ts
const contentSections = [
  { id: 'content-overview', label: '概览', mobileLabel: '概览' },
  { id: 'content-properties', label: '当前内容', mobileLabel: '内容' },
  { id: 'content-platforms', label: '平台矩阵', mobileLabel: '平台' },
  { id: 'content-loop', label: '运营闭环', mobileLabel: '运营' },
] as const
```

Use `IntersectionObserver` with:

```ts
{ rootMargin: '-22% 0px -62% 0px', threshold: [0, 0.15, 0.4, 0.7] }
```

Use `layoutId="content-section-active-indicator"`, `bounce: 0`, `duration: 0.3`, and responsive `<span>` labels. Keep the accessible name as the full desktop label through `aria-label`.

- [ ] **Step 4: Extend the shared navigation branch**

In `BrandNavigation.tsx`:

```ts
const usesSectionNavigation = current === 'group' || current === 'digital' || current === 'content'
```

Render the current area label with an explicit map:

```ts
const sectionAreaLabels = {
  content: '内容',
  digital: '数字',
  group: '集团',
} as const
```

Choose `GroupSectionNavigation`, `DigitalSectionNavigation`, or `ContentSectionNavigation` by `current`. Do not alter the navigation used by `home`.

- [ ] **Step 5: Clip content overflow at the page shell**

Change the shell condition so `content`, `digital`, and `group` use `overflow-x-clip`, without applying `overflow-hidden` to the entire content page.

- [ ] **Step 6: Run route tests and typecheck**

Run:

```bash
pnpm --filter @gaoge/app-brand test -- src/App.test.tsx
pnpm --filter @gaoge/app-brand typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit the navigation foundation**

```bash
git add apps/brand/src/pages/content/components/ContentSectionNavigation.tsx apps/brand/src/brand/components/BrandNavigation.tsx apps/brand/src/brand/components/BrandPageShell.tsx apps/brand/src/App.test.tsx
git commit -m "feat(brand): add content section navigation"
```

### Task 3: Build the content hero and reveal behavior

**Files:**

- Create: `apps/brand/src/pages/content/components/ContentHero.tsx`
- Create: `apps/brand/src/pages/content/components/ContentSectionReveal.tsx`
- Create: `apps/brand/src/pages/content/components/ContentSectionReveal.test.tsx`
- Modify: `apps/brand/src/pages/content/ContentPage.tsx`
- Test: `apps/brand/src/App.test.tsx`

**Interfaces:**

- Produces: `ContentHero(): JSX.Element` with root ID `content-overview`.
- Produces: `ContentSectionReveal({ children, className? }): JSX.Element`.

- [ ] **Step 1: Add failing hero copy assertions**

Update the `/content` route test:

```ts
expect(screen.getByRole('heading', { name: 'GAOGE CONTENT' })).toBeInTheDocument()
expect(screen.getByRole('heading', { name: '让每一份热爱持续被看见。' })).toBeInTheDocument()
expect(screen.getByText('以内容与运营连接品牌、平台和真实社群。')).toBeInTheDocument()
expect(screen.getByRole('img', { name: '高歌体育品牌分享图' })).toBeInTheDocument()
expect(document.querySelector('video')).not.toBeInTheDocument()
```

- [ ] **Step 2: Add the reveal component test**

Create a test matching the established digital reveal behavior:

```tsx
render(
  <ContentSectionReveal>
    <p>内容章节</p>
  </ContentSectionReveal>,
)

expect(screen.getByText('内容章节')).toBeInTheDocument()
```

Mock `IntersectionObserver` through the existing test setup and verify the wrapper does not hide content when reduced motion is requested.

- [ ] **Step 3: Run tests and confirm the new copy and component are missing**

Run:

```bash
pnpm --filter @gaoge/app-brand test -- src/App.test.tsx src/pages/content/components/ContentSectionReveal.test.tsx
```

Expected: FAIL before the new components exist.

- [ ] **Step 4: Implement `ContentSectionReveal`**

Follow the digital reveal contract but use the content class name:

```tsx
const reducedMotion = useReducedMotion()

return (
  <motion.div
    className={['content-section-reveal', className].filter(Boolean).join(' ')}
    initial={reducedMotion ? false : { opacity: 0, y: 20 }}
    transition={{ bounce: 0, duration: 0.4, type: 'spring' }}
    viewport={{ amount: 0.12, once: true }}
    whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
  >
    {children}
  </motion.div>
)
```

- [ ] **Step 5: Implement `ContentHero`**

Use a two-column layout equivalent in hierarchy, not markup, to `DigitalHero`:

```tsx
<section
  className="content-page-section content-hero mx-auto grid min-h-[calc(100dvh-4.25rem)] max-w-[1600px] items-center gap-8 px-6 pb-16 pt-12 md:min-h-[calc(100dvh-5rem)] md:px-10 md:pb-20 lg:grid-cols-[0.84fr_1.16fr] lg:gap-12 lg:pt-8"
  id="content-overview"
>
```

The copy column contains only the English label, headline, and approved support sentence. The image column uses `/assets/brand/gaoge-sports-share.jpg`, fixed intrinsic dimensions, `loading="eager"`, a warm dark scrim, and no video or CTA.

Wire `ContentHero` into `ContentPage` in place of the complete legacy hero section. Remove `backgroundVideo`, the `<video>` element, `useReducedMotion`, the legacy hero `Link`, and their unused imports. Leave the three legacy lower sections in place until Tasks 4 and 5 replace them.

- [ ] **Step 6: Run hero and reveal tests**

Run:

```bash
pnpm --filter @gaoge/app-brand test -- src/App.test.tsx src/pages/content/components/ContentSectionReveal.test.tsx
pnpm --filter @gaoge/app-brand typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit the hero components**

```bash
git add apps/brand/src/pages/content/ContentPage.tsx apps/brand/src/pages/content/components/ContentHero.tsx apps/brand/src/pages/content/components/ContentSectionReveal.tsx apps/brand/src/pages/content/components/ContentSectionReveal.test.tsx apps/brand/src/App.test.tsx
git commit -m "feat(brand): build content hero foundation"
```

### Task 4: Build the asymmetric current-content section

**Files:**

- Create: `apps/brand/src/pages/content/components/CurrentContent.tsx`
- Modify: `apps/brand/src/pages/content/ContentPage.tsx`
- Test: `apps/brand/src/App.test.tsx`

**Interfaces:**

- Consumes: `readonly ContentProperty[]` through `products`-style prop named `properties`.
- Produces: `CurrentContent({ properties }): JSX.Element` with root ID `content-properties`.

- [ ] **Step 1: Expand the route contract for current content**

Add assertions:

```ts
expect(screen.getByRole('heading', { name: '当前内容' })).toBeInTheDocument()
expect(screen.getByRole('heading', { name: '高歌体育' })).toBeInTheDocument()
expect(screen.getByRole('heading', { name: '高歌超级联赛' })).toBeInTheDocument()
expect(screen.getByRole('heading', { name: '主理人个人 IP' })).toBeInTheDocument()
expect(screen.getAllByText('运营中')).toHaveLength(1)
expect(screen.getAllByText('建设中')).toHaveLength(2)
```

Keep the existing external-link assertions and add:

```ts
expect(screen.queryByRole('link', { name: /主理人个人 IP/ })).not.toBeInTheDocument()
```

- [ ] **Step 2: Run the route test and confirm the new section heading fails**

Run:

```bash
pnpm --filter @gaoge/app-brand test -- src/App.test.tsx
```

Expected: FAIL on the missing `当前内容` heading.

- [ ] **Step 3: Implement current-content composition**

Implement focused helpers within `CurrentContent.tsx`:

```ts
interface CurrentContentProps {
  readonly properties: readonly ContentProperty[]
}
```

- First item: a linked primary surface with image and copy in a desktop split layout.
- Remaining items: two secondary surfaces, each with its own generated image, copy, status, and platform list.
- Use `MatrixStatus context="content"` so labels remain `运营中` and `建设中`.
- Use `PlatformRail` only as a small internal rail if its raised alternating offsets are removed; otherwise render a local compact platform list in this component.
- Only render `ArrowUpRight` and interactive transforms when `href` exists.

Replace the legacy `id="properties"` section in `ContentPage` with:

```tsx
<ContentSectionReveal>
  <CurrentContent properties={contentProperties} />
</ContentSectionReveal>
```

- [ ] **Step 4: Run route tests and typecheck**

Run:

```bash
pnpm --filter @gaoge/app-brand test -- src/App.test.tsx
pnpm --filter @gaoge/app-brand typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit the current-content section**

```bash
git add apps/brand/src/pages/content/ContentPage.tsx apps/brand/src/pages/content/components/CurrentContent.tsx apps/brand/src/App.test.tsx
git commit -m "feat(brand): add current content showcase"
```

### Task 5: Build platform coverage and the operating loop

**Files:**

- Create: `apps/brand/src/pages/content/components/ContentPlatforms.tsx`
- Create: `apps/brand/src/pages/content/components/ContentOperatingLoop.tsx`
- Modify: `apps/brand/src/pages/content/ContentPage.tsx`
- Test: `apps/brand/src/App.test.tsx`

**Interfaces:**

- `ContentPlatforms({ platforms }): JSX.Element` consumes `readonly ContentPlatform[]` and has root ID `content-platforms`.
- `ContentOperatingLoop({ capabilities }): JSX.Element` consumes `readonly string[]` and has root ID `content-loop`.

- [ ] **Step 1: Add failing section and complete-content assertions**

Add:

```ts
expect(screen.getByRole('heading', { name: '平台矩阵' })).toBeInTheDocument()
expect(screen.getByRole('heading', { name: '运营闭环' })).toBeInTheDocument()
;['公众号', '视频号', '小红书', '抖音', 'B 站', '社群与私域'].forEach((platform) => {
  expect(within(screen.getByTestId('content-platforms')).getByText(platform)).toBeInTheDocument()
})
;['内容策划', '图文与短视频生产', '多平台分发', '活动传播', '社群承接', '数据复盘'].forEach(
  (capability) => {
    expect(
      within(screen.getByTestId('content-operating-loop')).getByText(capability),
    ).toBeInTheDocument()
  },
)

expect(screen.getByText('让内容持续发生，也持续被理解。')).toBeInTheDocument()
```

- [ ] **Step 2: Run the route test and confirm the new scoped surfaces fail**

Run:

```bash
pnpm --filter @gaoge/app-brand test -- src/App.test.tsx
```

Expected: FAIL because the scoped test IDs and operating-loop copy do not exist.

- [ ] **Step 3: Implement `ContentPlatforms`**

Use one section container with an internal responsive grid:

```tsx
<section
  className="content-page-section mx-auto max-w-[1440px] scroll-mt-32 px-6 py-16 md:px-10 md:py-24"
  data-testid="content-platforms"
  id="content-platforms"
>
```

Map configured labels from `platformLabels`. Use a six-cell internal grid with varied spans, one shared surface, sparse dividers, and explicit `grid-cols-2` mobile fallback. Do not add external links or icons.

Replace the legacy platform section in `ContentPage` with:

```tsx
<ContentSectionReveal>
  <ContentPlatforms platforms={allPlatforms} />
</ContentSectionReveal>
```

- [ ] **Step 4: Implement `ContentOperatingLoop`**

Render the six capabilities in semantic order inside one responsive path surface. Desktop uses a six-column or `3 + 3` layout; mobile uses a single column. Use `aria-label="高歌内容运营闭环"`, and include the approved closing statement once. Do not render numeric labels.

Replace the legacy capability section in `ContentPage` with:

```tsx
<ContentSectionReveal>
  <ContentOperatingLoop capabilities={contentCapabilities} />
</ContentSectionReveal>
```

- [ ] **Step 5: Run route tests and typecheck**

Run:

```bash
pnpm --filter @gaoge/app-brand test -- src/App.test.tsx
pnpm --filter @gaoge/app-brand typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit the operating sections**

```bash
git add apps/brand/src/pages/content/ContentPage.tsx apps/brand/src/pages/content/components/ContentPlatforms.tsx apps/brand/src/pages/content/components/ContentOperatingLoop.tsx apps/brand/src/App.test.tsx
git commit -m "feat(brand): add content operating sections"
```

### Task 6: Compose the page and add the content visual system

**Files:**

- Modify: `apps/brand/src/pages/content/ContentPage.tsx`
- Modify: `apps/brand/src/styles.css`
- Test: `apps/brand/src/App.test.tsx`

**Interfaces:**

- Consumes all components from Tasks 2-5.
- Produces the complete `/content` page while preserving `useBrandMetadata` and `BrandPageShell` footer links.

- [ ] **Step 1: Finalize the composed page and remove obsolete imports**

Keep metadata and the cross-link:

```tsx
<BrandPageShell current="content" crossLink={{ label: '进入高歌数字', to: '/digital' }}>
  <ContentHero />
  <ContentSectionReveal>
    <CurrentContent properties={contentProperties} />
  </ContentSectionReveal>
  <ContentSectionReveal>
    <ContentPlatforms platforms={allPlatforms} />
  </ContentSectionReveal>
  <ContentSectionReveal>
    <ContentOperatingLoop capabilities={contentCapabilities} />
  </ContentSectionReveal>
</BrandPageShell>
```

Confirm `ContentPage.tsx` matches this composition, then remove `propertySizes`, `ContentPropertyBlock`, `PlatformRail`, and every other obsolete import or constant. Do not delete the old component files.

- [ ] **Step 2: Add content-scoped surface tokens**

In `styles.css`, preserve the existing content accent variables and replace the flat background with a subtle warm-red dark field:

```css
.brand-matrix-page[data-brand-area='content'] {
  --brand-accent: 191 74 66;
  --brand-surface: 30 24 24;
  --brand-muted: 185 171 169;

  background:
    radial-gradient(circle at 78% 8%, rgb(191 74 66 / 8%), transparent 28%),
    linear-gradient(180deg, #110e0e, #171212 48%, #100e0e);
}
```

- [ ] **Step 3: Add focused component materials**

Define content-scoped classes only:

```css
.content-hero-visual,
.content-current-primary,
.content-current-secondary,
.content-platform-surface,
.content-loop-surface {
  border: 1px solid rgb(255 245 242 / 10%);
  background: rgb(30 24 24 / 76%);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 6%);
}
```

Use `border-radius: 1.5rem`, warm-tinted shadows, and no outer glow. Add `content-section-navigation-track` rules matching digital behavior: right aligned, hidden scrollbar, mobile mask, and no page overflow.

- [ ] **Step 4: Add accessibility media-query fallbacks**

Under existing queries:

```css
@media (prefers-reduced-transparency: reduce) {
  .content-hero-visual,
  .content-current-primary,
  .content-current-secondary,
  .content-platform-surface,
  .content-loop-surface {
    background: rgb(30 24 24 / 96%);
  }
}

@media (prefers-contrast: more) {
  .content-hero-visual,
  .content-current-primary,
  .content-current-secondary,
  .content-platform-surface,
  .content-loop-surface {
    border-color: rgb(255 255 255 / 28%);
  }
}
```

Ensure the existing reduced-motion block neutralizes `.content-section-reveal` and hero motion transforms.

- [ ] **Step 5: Run the complete content route contract**

Run:

```bash
pnpm --filter @gaoge/app-brand test -- src/App.test.tsx src/pages/content/data.test.ts src/pages/content/components/ContentSectionReveal.test.tsx
pnpm --filter @gaoge/app-brand typecheck
pnpm exec eslint apps/brand/src
pnpm exec stylelint "apps/brand/src/**/*.css"
```

Expected: PASS.

- [ ] **Step 6: Perform the copy and design pre-flight**

Check all visible `/content` strings for clarity and confirm:

- zero em-dash characters;
- one eyebrow in the hero and none in the next two sections;
- hero copy has three text elements and no CTA;
- no fake metrics, platform links, account names, version labels, section numbering, or scroll cues;
- all three content properties have real raster imagery;
- each multi-column section has an explicit mobile collapse;
- only 高歌体育 looks interactive.

- [ ] **Step 7: Commit the composed redesign**

```bash
git add apps/brand/src/pages/content/ContentPage.tsx apps/brand/src/styles.css apps/brand/src/App.test.tsx apps/brand/src/pages/content/components
git commit -m "feat(brand): redesign content operating matrix page"
```

### Task 7: Run final automated and visual verification

**Files:**

- Verify only; modify implementation files only if a reproduced issue requires a focused fix.

**Interfaces:**

- Consumes the complete `/content` route.
- Produces verification evidence and a clean worktree.

- [ ] **Step 1: Run the full Brand verification batch**

Run:

```bash
pnpm --filter @gaoge/app-brand test
pnpm --filter @gaoge/app-brand typecheck
pnpm build:brand
pnpm exec eslint apps/brand/src
pnpm exec stylelint "apps/brand/src/**/*.css"
pnpm exec prettier --check "apps/brand/src/**/*.{ts,tsx,css}"
git diff --check
```

Expected: 17 test files and at least 101 tests pass; all other commands exit `0`.

- [ ] **Step 2: Start the local Brand app for browser QA**

Run:

```bash
pnpm dev:brand -- --host 127.0.0.1
```

Use the actual port printed by Vite.

- [ ] **Step 3: Verify desktop and tablet layouts**

Check `/content` at:

- `1440×900`: hero fits the first viewport, navigation remains one line, `1 + 2` hierarchy is clear.
- `1024×768`: complete labels remain visible and headline does not form single-character lines.

For each size, record `document.documentElement.scrollWidth` and `clientWidth`; they must match.

- [ ] **Step 4: Verify mobile layouts**

Check:

- `390×844`: visible labels are `概览 / 内容 / 平台 / 运营`, aligned right.
- `320×800`: content names, statuses, and platform items remain readable with no page-level horizontal overflow.

- [ ] **Step 5: Verify interaction and semantics**

- Click each section navigation item and confirm the hash and active indicator update.
- Confirm 高歌体育 is the only linked content property.
- Confirm its `target="_blank"` and `rel="noopener noreferrer"` attributes.
- Confirm the remote video element is absent.
- Keyboard through brand mark, section navigation, 高歌体育, and footer links; focus rings must remain visible.

- [ ] **Step 6: Run the knowledge impact check**

Call `impact_for_changes` for every modified and created repository-relative path. If the current `gaoge` source-map diagnostic remains missing, report it as a knowledge-maintenance follow-up and rely on current source behavior.

- [ ] **Step 7: Run post-format verification and inspect Git state**

After any pre-commit hook formatting, rerun:

```bash
pnpm --filter @gaoge/app-brand test
pnpm --filter @gaoge/app-brand typecheck
pnpm build:brand
git status --short
```

Expected: all commands pass and the intended implementation is committed with no unrelated worktree changes.
