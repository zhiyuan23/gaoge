# Brand Digital Product Roadmap Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign `apps/brand` `/digital` as a product-roadmap brand page that clearly separates current products from future plans while sharing `/group`'s visual language.

**Architecture:** Keep `data.ts` as the single static content source and add page-private presentation components for the hero, current products, roadmap, delivery strip, section navigation, and reveal behavior. Extend the existing formal brand navigation with a digital capsule mode, but keep digital section observation inside `pages/digital`; compose everything in `DigitalPage.tsx` without changing APIs, routes, or other brand pages.

**Tech Stack:** React 18, TypeScript, React Router 6, Tailwind CSS 3, Framer Motion 12, Vitest, Testing Library.

## Global Constraints

- `/group` is a visual-language reference, not a structural template.
- `/digital` must present current products, building products, future product plans, and delivery boundaries truthfully.
- Keep the existing dark green-black, sage accent, cool-white typography, translucent capsule navigation, and restrained one-time motion.
- Do not reuse the group orbit, organization layout, leadership cards, or group business components.
- Do not add APIs, CMS integration, remote configuration, product-detail routes, filters, search, dates, progress percentages, fabricated screenshots, metrics, or customer claims.
- Do not change current product statuses, the Compass URL, routes, APIs, deployment, `/group`, `/content`, the homepage, or the sports app.
- Do not add dependencies.
- Preserve a 320px minimum viewport without horizontal page overflow.
- Use existing `MatrixStatus` text so status is never communicated by color alone.
- `prefers-reduced-motion`, `prefers-reduced-transparency`, and `prefers-contrast` must retain usable fallbacks.
- Follow the repository preference: implement the confirmed design as a whole, use low-cost focused test-first checks where existing tests provide a mature entry point, then run unified verification.

---

## File Map

### Create

- `apps/brand/src/pages/digital/components/DigitalSectionNavigation.tsx` — observes the four digital sections and renders the scroll-aware page index.
- `apps/brand/src/pages/digital/components/DigitalHero.tsx` — renders the product proposition and decorative product workspace.
- `apps/brand/src/pages/digital/components/CurrentProducts.tsx` — renders the asymmetric current-product `1 + 2` composition.
- `apps/brand/src/pages/digital/components/ProductRoadmap.tsx` — groups planned products by product family in directory rows.
- `apps/brand/src/pages/digital/components/DigitalDelivery.tsx` — renders the compact delivery-boundary strip.
- `apps/brand/src/pages/digital/components/DigitalSectionReveal.tsx` — provides one-time section entrance with reduced-motion behavior.
- `apps/brand/src/pages/digital/components/DigitalSectionReveal.test.tsx` — verifies the reveal wrapper is attached without requiring visual snapshots.

### Modify

- `apps/brand/src/pages/digital/data.ts` — export planned products, roadmap labels/order, and the complete delivery-capability list.
- `apps/brand/src/pages/digital/data.test.ts` — lock current/planned separation, family coverage, and multi-end delivery placement.
- `apps/brand/src/pages/digital/DigitalPage.tsx` — replace the old card matrix with the new page composition and copy.
- `apps/brand/src/brand/components/BrandNavigation.tsx` — render the digital page in the same capsule chrome family as the group page.
- `apps/brand/src/styles.css` — add semantic digital-page material, workspace, navigation-mask, and accessibility fallback styles.
- `apps/brand/src/App.test.tsx` — update `/digital` route assertions for the new hierarchy, navigation, truthfulness, and link behavior.

### Retain Without Rendering

- `apps/brand/src/pages/digital/components/FeaturedProduct.tsx`
- `apps/brand/src/pages/digital/components/DigitalDirectory.tsx`

Do not delete these files in this task. They are no longer composed by `DigitalPage`, but removing them is unrelated cleanup.

---

### Task 1: Lock Product-State and Roadmap Data Contracts

**Files:**

- Modify: `apps/brand/src/pages/digital/data.ts`
- Modify: `apps/brand/src/pages/digital/data.test.ts`

**Interfaces:**

- Produces: `plannedDigitalProducts: readonly DigitalProduct[]`
- Produces: `digitalCategoryLabels: Readonly<Record<DigitalCategory, string>>`
- Produces: `digitalCategoryOrder: readonly DigitalCategory[]`
- Produces: `digitalCapabilities: readonly string[]` including `多端交付`
- Existing `featuredDigitalProducts` remains the source for the three current products.

- [ ] **Step 1: Add focused failing tests for the page's product-state contract**

Extend `data.test.ts` imports and tests with:

```ts
import {
  digitalCapabilities,
  digitalCategoryOrder,
  digitalProducts,
  featuredDigitalProducts,
  plannedDigitalProducts,
} from '@/pages/digital/data'

it('separates the three current products from future product plans', () => {
  expect(featuredDigitalProducts.map(({ name, status }) => ({ name, status }))).toEqual([
    { name: '高歌跨境 ERP', status: 'live' },
    { name: '高歌 Club', status: 'building' },
    { name: '高歌客户 CRM', status: 'building' },
  ])
  expect(plannedDigitalProducts.every(({ status }) => status === 'planned')).toBe(true)
  expect(plannedDigitalProducts.map(({ name }) => name)).not.toContain('多端交付')
})

it('defines the roadmap family order and delivery capabilities', () => {
  expect(digitalCategoryOrder).toEqual(['enterprise', 'consumer', 'platform'])
  expect(digitalCapabilities).toContain('多端交付')
  expect(digitalCapabilities).toContain('后续 SaaS')
})
```

- [ ] **Step 2: Run the data test and verify the new exports fail**

Run:

```bash
pnpm --filter @gaoge/app-brand test -- src/pages/digital/data.test.ts
```

Expected: FAIL because `plannedDigitalProducts`, `digitalCategoryOrder`, and the updated delivery list are not yet defined.

- [ ] **Step 3: Add the minimal data exports**

In `data.ts`, keep all product records unchanged and add:

```ts
export const digitalCategoryLabels = {
  consumer: '消费者产品',
  enterprise: '企业软件',
  platform: '平台能力',
} as const satisfies Record<DigitalCategory, string>

export const digitalCategoryOrder: readonly DigitalCategory[] = [
  'enterprise',
  'consumer',
  'platform',
]

export const plannedDigitalProducts = digitalProducts.filter(({ status }) => status === 'planned')
```

Change `digitalCapabilities` to this exact order:

```ts
export const digitalCapabilities = [
  '独立产品',
  '共享平台能力',
  '独立部署与专属云',
  '多端交付',
  '后续 SaaS',
] as const
```

Keep `featuredDigitalProducts` and `digitalDirectory` exports intact so retained legacy components continue to typecheck.

- [ ] **Step 4: Run the focused test and typecheck**

Run:

```bash
pnpm --filter @gaoge/app-brand test -- src/pages/digital/data.test.ts
pnpm --filter @gaoge/app-brand typecheck
```

Expected: both commands PASS.

- [ ] **Step 5: Commit the data contract**

```bash
git add apps/brand/src/pages/digital/data.ts apps/brand/src/pages/digital/data.test.ts
git commit -m "refactor(brand): define digital product roadmap data"
```

---

### Task 2: Build Current Products, Roadmap, and Delivery Sections

**Files:**

- Create: `apps/brand/src/pages/digital/components/CurrentProducts.tsx`
- Create: `apps/brand/src/pages/digital/components/ProductRoadmap.tsx`
- Create: `apps/brand/src/pages/digital/components/DigitalDelivery.tsx`

**Interfaces:**

- `CurrentProducts({ products }: { products: readonly DigitalProduct[] }): JSX.Element`
- `ProductRoadmap({ products }: { products: readonly DigitalProduct[] }): JSX.Element`
- `DigitalDelivery({ capabilities }: { capabilities: readonly string[] }): JSX.Element`
- Consumes `DigitalProduct`, `digitalCategoryLabels`, and `digitalCategoryOrder` from Task 1.

- [ ] **Step 1: Implement `CurrentProducts` with truthful interaction semantics**

Use a private `ProductBody` helper for shared copy, tags, and status. Render the primary product as an external anchor only when `href` exists; render the two building products as `<article>` elements.

The required structure is:

```tsx
const [primaryProduct, ...secondaryProducts] = products

<section className="digital-page-section mx-auto max-w-[1440px] px-6 py-16 md:px-10 md:py-24" id="digital-current">
  <header>
    <h2>当前产品</h2>
    <p>先展示已经运行和正在建设的产品，状态、边界与入口清晰可见。</p>
  </header>
  <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
    {primaryProduct?.href ? (
      <a
        aria-label={`${primaryProduct.name}，打开产品站点`}
        href={primaryProduct.href}
        rel="noopener noreferrer"
        target="_blank"
      >
        <ProductContent product={primaryProduct} />
      </a>
    ) : null}
    <div className="grid gap-4">
      {secondaryProducts.map((product) => (
        <article key={product.name}>
          <ProductContent product={product} />
        </article>
      ))}
    </div>
  </div>
</section>
```

The Compass link must retain:

```tsx
target="_blank"
rel="noopener noreferrer"
aria-label={`${product.name}，打开产品站点`}
```

Use `MatrixStatus context="digital"`, keep CTA text on one line, add `active:scale-[0.985]` only to the real link, and do not add hover lift to read-only articles.

- [ ] **Step 2: Implement `ProductRoadmap` as grouped rows, not a card wall**

Group inside the component using the exact order from Task 1:

```tsx
const groupedProducts = digitalCategoryOrder.map((category) => ({
  category,
  products: products.filter((product) => product.category === category),
}))
```

Render:

```tsx
<section
  className="digital-page-section mx-auto max-w-[1440px] px-6 py-16 md:px-10 md:py-24"
  id="digital-roadmap"
>
  <h2>未来产品规划</h2>
  <p>按产品族展示规划，不把尚未交付的方向包装成现有能力。</p>
  <div className="mt-10 border-t border-white/10">
    {groupedProducts.map(({ category, products: categoryProducts }) => (
      <section
        className="grid gap-5 border-b border-white/10 py-7 md:grid-cols-[10rem_1fr_auto]"
        key={category}
      >
        <h3>{digitalCategoryLabels[category]}</h3>
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {categoryProducts.map((product) => (
            <article key={product.name}>
              <h4>{product.name}</h4>
              <p>{product.summary}</p>
            </article>
          ))}
        </div>
        <span>规划中</span>
      </section>
    ))}
  </div>
</section>
```

Each product remains plain information with no link, fake CTA, date, percentage, or hover lift.

- [ ] **Step 3: Implement `DigitalDelivery` as a single information band**

Render the exact ID and copy:

```tsx
<section
  className="digital-page-section mx-auto max-w-[1440px] px-6 py-16 md:px-10 md:py-24"
  id="digital-delivery"
>
  <h2>产品如何被交付</h2>
  <div className="digital-delivery-model">
    <p>清晰边界，持续演进。</p>
    <ul>
      {capabilities.map((capability) => (
        <li key={capability}>{capability}</li>
      ))}
    </ul>
  </div>
</section>
```

Use one border band and negative space instead of five separate cards.

- [ ] **Step 4: Format and typecheck the section components**

Run:

```bash
pnpm exec prettier --write apps/brand/src/pages/digital/components/CurrentProducts.tsx apps/brand/src/pages/digital/components/ProductRoadmap.tsx apps/brand/src/pages/digital/components/DigitalDelivery.tsx
pnpm --filter @gaoge/app-brand typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit the product sections**

```bash
git add apps/brand/src/pages/digital/components/CurrentProducts.tsx apps/brand/src/pages/digital/components/ProductRoadmap.tsx apps/brand/src/pages/digital/components/DigitalDelivery.tsx
git commit -m "feat(brand): add digital product roadmap sections"
```

---

### Task 3: Add Digital Hero and Restrained Section Motion

**Files:**

- Create: `apps/brand/src/pages/digital/components/DigitalHero.tsx`
- Create: `apps/brand/src/pages/digital/components/DigitalSectionReveal.tsx`
- Create: `apps/brand/src/pages/digital/components/DigitalSectionReveal.test.tsx`

**Interfaces:**

- `DigitalHero(): JSX.Element`
- `DigitalSectionReveal({ children }: { readonly children: ReactNode }): JSX.Element`
- Neither component accepts product data; the hero workspace is decorative and uses confirmed Compass copy only.

- [ ] **Step 1: Add the focused reveal behavior test**

Create `DigitalSectionReveal.test.tsx`:

```tsx
import { render, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import DigitalSectionReveal from './DigitalSectionReveal'

describe('DigitalSectionReveal', () => {
  it('attaches a one-time entrance transform to its section', async () => {
    const { container } = render(
      <DigitalSectionReveal>
        <section>产品内容</section>
      </DigitalSectionReveal>,
    )

    await waitFor(() => {
      const reveal = container.querySelector<HTMLElement>('.digital-section-reveal')
      expect(reveal).toBeInTheDocument()
      expect(reveal?.style.transform).toContain('translate3d')
    })
  })
})
```

- [ ] **Step 2: Run the test and verify it fails because the component is missing**

Run:

```bash
pnpm --filter @gaoge/app-brand test -- src/pages/digital/components/DigitalSectionReveal.test.tsx
```

Expected: FAIL with module resolution error for `DigitalSectionReveal`.

- [ ] **Step 3: Implement the reveal wrapper**

Match the group's restraint without importing its private component:

```tsx
export default function DigitalSectionReveal({ children }: DigitalSectionRevealProps) {
  const reducedMotion = useReducedMotion()

  return (
    <motion.div
      className="digital-section-reveal"
      initial={reducedMotion ? false : { opacity: 0.64, transform: 'translate3d(0, 18px, 0)' }}
      transition={{ duration: 0.42, ease: [0.23, 1, 0.32, 1] }}
      viewport={{ amount: 0.12, margin: '-64px 0px', once: true }}
      whileInView={{ opacity: 1, transform: 'translate3d(0, 0, 0)' }}
    >
      {children}
    </motion.div>
  )
}
```

- [ ] **Step 4: Implement the hero and product workspace**

`DigitalHero` must render:

```tsx
<section className="digital-page-section digital-hero ..." id="digital-overview">
  <motion.div>
    <h1>GAOGE DIGITAL</h1>
    <h2>让复杂业务，运行得更清晰。</h2>
    <p>以技术与产品思维，把真实需求转化为持续演进的数字产品。</p>
  </motion.div>
  <motion.div aria-hidden="true" className="digital-product-workspace">
    <div className="digital-product-workspace-back" />
    <div className="digital-product-workspace-primary">
      <span>GAOGE COMPASS</span>
      <strong>高歌跨境 ERP</strong>
    </div>
    <div className="digital-product-workspace-status">
      <span>持续交付</span>
      <strong>正在演进</strong>
    </div>
  </motion.div>
</section>
```

Required visible copy:

- `GAOGE DIGITAL`
- `让复杂业务，运行得更清晰。`
- `以技术与产品思维，把真实需求转化为持续演进的数字产品。`
- Decorative labels may include `GAOGE COMPASS`, `高歌跨境 ERP`, `持续交付`, and `正在演进`.

Use `useReducedMotion()` and `bounce: 0` springs around `0.4s`. Do not add parallax, looping animation, fake metrics, or pointer gestures.

- [ ] **Step 5: Run the focused test and typecheck**

Run:

```bash
pnpm --filter @gaoge/app-brand test -- src/pages/digital/components/DigitalSectionReveal.test.tsx
pnpm --filter @gaoge/app-brand typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit the hero and reveal behavior**

```bash
git add apps/brand/src/pages/digital/components/DigitalHero.tsx apps/brand/src/pages/digital/components/DigitalSectionReveal.tsx apps/brand/src/pages/digital/components/DigitalSectionReveal.test.tsx
git commit -m "feat(brand): add digital product hero motion"
```

---

### Task 4: Add Digital Section Navigation and Capsule Chrome

**Files:**

- Create: `apps/brand/src/pages/digital/components/DigitalSectionNavigation.tsx`
- Modify: `apps/brand/src/brand/components/BrandNavigation.tsx`
- Modify: `apps/brand/src/App.test.tsx`

**Interfaces:**

- `DigitalSectionNavigation(): JSX.Element`
- Stable section IDs: `digital-overview`, `digital-current`, `digital-roadmap`, `digital-delivery`.
- `BrandNavigation` keeps its public prop types unchanged.

- [ ] **Step 1: Update the route test with the new navigation contract**

Replace the old `/digital` assertions for the global area navigation with:

```tsx
const sectionNavigation = screen.getByLabelText('数字页面章节')

expect(
  within(sectionNavigation)
    .getAllByRole('link')
    .map((link) => [link.textContent, link.getAttribute('href')]),
).toEqual([
  ['概览', '#digital-overview'],
  ['当前产品', '#digital-current'],
  ['产品规划', '#digital-roadmap'],
  ['交付能力', '#digital-delivery'],
])
expect(screen.getByText('数字')).toBeInTheDocument()
```

Keep the footer assertion for `进入高歌内容`; remove only the old expectation that the top navigation includes `/content` and the sports external link.

- [ ] **Step 2: Run the route test and verify the new navigation fails**

Run:

```bash
pnpm --filter @gaoge/app-brand test -- src/App.test.tsx
```

Expected: FAIL because the digital section navigation does not exist.

- [ ] **Step 3: Implement `DigitalSectionNavigation`**

Use the same observer pattern as `GroupSectionNavigation`, with this exact definition:

```ts
const digitalSections = [
  { id: 'digital-overview', label: '概览' },
  { id: 'digital-current', label: '当前产品' },
  { id: 'digital-roadmap', label: '产品规划' },
  { id: 'digital-delivery', label: '交付能力' },
] as const
```

The component must:

- initialize `activeSection` to `digital-overview`;
- observe all four section IDs with `rootMargin: '-22% 0px -62% 0px'` and thresholds `[0, 0.15, 0.4, 0.7]`;
- select the visible section with the highest intersection ratio;
- scroll the active link inline-center using `auto` for reduced motion and `smooth` otherwise;
- render `aria-current="location"` for the active anchor;
- use a `layoutId="digital-section-active-indicator"` Motion span with `{ type: 'spring', bounce: 0, duration: 0.3 }`.

- [ ] **Step 4: Add digital capsule mode to `BrandNavigation`**

Import `DigitalSectionNavigation` and treat `digital` as a capsule-page mode alongside `group`:

```tsx
const usesSectionNavigation = current === 'group' || current === 'digital'
```

In the capsule branch:

- keep the existing GAOGE home link and rotated brand mark;
- display `集团` for group and `数字` for digital;
- render `GroupSectionNavigation` only for group;
- render `DigitalSectionNavigation` only for digital;
- retain `group-entry-navigation` only on the group page;
- use the existing `brand-group-navigation brand-navigation-surface` material classes for both.

Do not change home, content, dialog, or sports-link behavior.

- [ ] **Step 5: Run the route test and group navigation regression tests**

Run:

```bash
pnpm --filter @gaoge/app-brand test -- src/App.test.tsx
pnpm --filter @gaoge/app-brand typecheck
```

Expected: PASS, including the existing group mobile-navigation test.

- [ ] **Step 6: Commit the digital navigation**

```bash
git add apps/brand/src/pages/digital/components/DigitalSectionNavigation.tsx apps/brand/src/brand/components/BrandNavigation.tsx apps/brand/src/App.test.tsx
git commit -m "feat(brand): add digital page section navigation"
```

---

### Task 5: Compose the Redesigned Page and Add Its Visual System

**Files:**

- Modify: `apps/brand/src/pages/digital/DigitalPage.tsx`
- Modify: `apps/brand/src/styles.css`
- Modify: `apps/brand/src/App.test.tsx`

**Interfaces:**

- Consumes every component and data export from Tasks 1–4.
- Keeps route `/digital`, page title `高歌数字 - 数字产品矩阵`, description metadata, footer home link, and footer `/content` cross-link unchanged.

- [ ] **Step 1: Update the `/digital` route test for the approved hierarchy**

The final route test must assert:

```tsx
expect(screen.getByRole('heading', { name: '让复杂业务，运行得更清晰。' })).toBeInTheDocument()
expect(screen.getByRole('heading', { name: '当前产品' })).toBeInTheDocument()
expect(screen.getByRole('heading', { name: '未来产品规划' })).toBeInTheDocument()
expect(screen.getByRole('heading', { name: '产品如何被交付' })).toBeInTheDocument()

expect(screen.getAllByText('运行中')).toHaveLength(1)
expect(screen.getAllByText('建设中')).toHaveLength(2)
expect(screen.getAllByText('规划中')).toHaveLength(3)
expect(screen.getByText('多端交付')).toBeInTheDocument()
expect(screen.getByText('后续 SaaS')).toBeInTheDocument()

const compass = screen.getByRole('link', { name: /高歌跨境 ERP/ })
expect(compass).toHaveAttribute('href', 'https://compass.gaoge.cc')
expect(compass).toHaveAttribute('target', '_blank')
expect(compass).toHaveAttribute('rel', 'noopener noreferrer')
expect(screen.queryByRole('link', { name: /高歌 Club/ })).not.toBeInTheDocument()
expect(screen.queryByRole('link', { name: /高歌通用 ERP/ })).not.toBeInTheDocument()
```

Use scoped queries if decorative hero copy duplicates a product name; the decorative workspace should prefer `aria-hidden="true"` to avoid duplicate accessible content.

- [ ] **Step 2: Replace `DigitalPage` composition**

The component body becomes:

```tsx
<BrandPageShell current="digital" crossLink={{ label: '进入高歌内容', to: '/content' }}>
  <DigitalHero />
  <DigitalSectionReveal>
    <CurrentProducts products={featuredDigitalProducts} />
  </DigitalSectionReveal>
  <DigitalSectionReveal>
    <ProductRoadmap products={plannedDigitalProducts} />
  </DigitalSectionReveal>
  <DigitalSectionReveal>
    <DigitalDelivery capabilities={digitalCapabilities} />
  </DigitalSectionReveal>
</BrandPageShell>
```

Remove imports and rendering for `FeaturedProduct`, `DigitalDirectory`, and the old page-local hero markup. Keep the existing metadata call.

- [ ] **Step 3: Add only semantic global CSS that Tailwind cannot express cleanly**

Add these semantic hooks to `styles.css`:

- `.digital-page-section` — shared scroll margin matching the capsule navigation height.
- `.digital-product-workspace` and its named child surfaces — layered background, border, inset highlight, tinted shadow, and `will-change` only during entrance.
- `.digital-section-navigation` and `.digital-section-navigation-track` — hidden scrollbar and mobile edge mask.
- `.digital-delivery-model` — one bordered material band, not five cards.

Use Tailwind in JSX for layout, spacing, typography, normal borders, states, and responsive collapse. Keep a single radius rule: pill navigation/status controls; 20–24px product surfaces; 14–16px nested workspace surfaces.

Extend the existing media queries:

```css
@media (prefers-reduced-transparency: reduce) {
  .digital-product-workspace,
  .digital-delivery-model {
    background: rgb(18 22 20 / 98%);
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
  }
}

@media (prefers-contrast: more) {
  .digital-product-workspace,
  .digital-delivery-model {
    border-color: rgb(255 255 255 / 42%);
  }
}
```

The existing `.brand-matrix-page *` reduced-motion rule remains the global fallback; do not add duplicate keyframes or infinite animation.

- [ ] **Step 4: Run route, data, and reveal tests**

Run:

```bash
pnpm --filter @gaoge/app-brand test -- src/App.test.tsx src/pages/digital/data.test.ts src/pages/digital/components/DigitalSectionReveal.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Run brand typecheck and focused lint/style checks**

Run:

```bash
pnpm --filter @gaoge/app-brand typecheck
pnpm exec eslint apps/brand/src
pnpm exec stylelint "apps/brand/src/**/*.css"
pnpm exec prettier --check apps/brand/src
```

Expected: PASS with no new warnings.

- [ ] **Step 6: Commit the composed redesign**

```bash
git add apps/brand/src/pages/digital/DigitalPage.tsx apps/brand/src/styles.css apps/brand/src/App.test.tsx
git commit -m "feat(brand): redesign digital product roadmap page"
```

---

### Task 6: Full Verification and Responsive Visual QA

**Files:**

- Modify only if verification exposes a defect in the files listed above.

**Interfaces:**

- Produces a verified `/digital` page and preserves all existing brand routes.

- [ ] **Step 1: Run the complete brand test suite**

Run:

```bash
pnpm --filter @gaoge/app-brand test
```

Expected: PASS with no changed group, content, home, or concept-route behavior.

- [ ] **Step 2: Run the production checks**

Run:

```bash
pnpm --filter @gaoge/app-brand typecheck
pnpm --filter @gaoge/app-brand build
pnpm exec eslint apps/brand/src
pnpm exec stylelint "apps/brand/src/**/*.css"
pnpm exec prettier --check apps/brand/src docs/superpowers/specs docs/superpowers/plans
```

Expected: every command exits `0`.

- [ ] **Step 3: Inspect `/digital` at desktop and tablet sizes**

Start the existing app with `pnpm dev:brand`. In the browser inspect:

- `1440×900`: hero, CTA, and product scene fit the initial viewport; capsule navigation is one line; current `1 + 2` hierarchy is clear.
- `1024×768`: product workspace and hero copy remain balanced; roadmap rows do not collide with status text.
- Verify the Compass link target and focus-visible state without opening any untrusted or unrelated external page.

- [ ] **Step 4: Inspect `/digital` at mobile sizes**

Inspect:

- `390×844`: hero becomes copy then product scene; current products become one column; roadmap rows become vertical.
- `320×800`: no page-level horizontal scroll; the capsule section navigation stays usable; product names keep their essential meaning.
- Confirm the footer retains `返回高歌首页` and `进入高歌内容`.

- [ ] **Step 5: Inspect accessibility preferences and interaction feedback**

Verify:

- reduced motion removes spring/slide movement while content remains visible;
- reduced transparency produces near-solid navigation and material surfaces;
- increased contrast strengthens borders, text, and focus rings;
- only Compass presents hover/active link affordance;
- planned and building products remain read-only;
- section links update and can be interrupted/reselected without input lock.

- [ ] **Step 6: Fix only defects found by verification, then rerun affected checks**

Keep fixes inside the files named in this plan. Rerun the smallest failing command first, then repeat the full production checks from Step 2.

- [ ] **Step 7: Commit any verification-only fixes**

If Step 6 changed files:

```bash
git add apps/brand/src
git commit -m "fix(brand): polish digital roadmap responsiveness"
```

If no files changed, do not create an empty commit.
