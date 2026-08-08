# Gaoge Group Digital Showcase Implementation Plan

> **Execution mode:** Implement inline in the current session. Do not use subagents and do not use TDD; complete the confirmed implementation first, then run unified verification.

**Goal:** Add a customer-facing Gaoge Digital section to `/group` with one primary Gaoge Compass card, two secondary Gaoge CRM and Gaoge Club cards, demo links, and four product capability directions.

**Architecture:** Keep all public copy and links in the existing group-page static data module, introduce one page-private `DigitalStructure` presentation component, and insert it between `GroupHero` and `SportsStructure`. Reuse the current group page's Tailwind visual language without changing shared components, adding dependencies, or coupling `/group` to `/digital` data contracts.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS utilities, lucide-react, Vitest, Testing Library

## Global Constraints

- Preserve all pre-existing uncommitted work in `apps/brand`; do not revert, overwrite, stage, or commit unrelated changes.
- Product links are exactly `https://compass.gaoge.cc?demo`, `https://crm.gaoge.cc?demo`, and `https://club.gaoge.cc?demo`.
- Every product link opens a new window with `target="_blank"` and `rel="noopener noreferrer"`.
- Do not modify `/digital`, any independent product repository, API, CMS, database, or deployment configuration.
- Do not add dependencies, product screenshots, customer claims, pricing, contact forms, or unverified feature promises.
- Keep public copy and product data in `apps/brand/src/pages/group/data.ts` and page-private types in `apps/brand/src/pages/group/types.ts`.
- Render Gaoge Compass first in DOM order, followed by Gaoge CRM and Gaoge Club, so mobile order remains primary-first.
- Use only the existing brand colors, spacing, focus treatment, and reduced-motion behavior.
- Do not use subagents or test-first development for this task. Update implementation and its tests together, then run the focused and full verification commands.

---

## File Structure

- `apps/brand/src/pages/group/types.ts`: define the static contracts for digital products and capability directions.
- `apps/brand/src/pages/group/data.ts`: own the three product records and four customer capability records.
- `apps/brand/src/pages/group/data.test.ts`: verify exact names, emphasis, order, descriptions, and demo URLs.
- `apps/brand/src/pages/group/components/DigitalStructure.tsx`: render the complete Gaoge Digital section, product cards, external-link semantics, and capability list.
- `apps/brand/src/pages/group/GroupPage.tsx`: place the new section between the hero and sports sections.
- `apps/brand/src/App.test.tsx`: verify public rendering, section order, links, card hierarchy, copy, and preservation of the existing group modules.

No shared package or stylesheet file is required. The component uses existing Tailwind utilities, avoiding overlap with the user's in-progress `apps/brand/src/styles.css` changes.

### Task 1: Define and verify the group digital showcase data

**Files:**

- Modify: `apps/brand/src/pages/group/types.ts`
- Modify: `apps/brand/src/pages/group/data.ts`
- Modify: `apps/brand/src/pages/group/data.test.ts`

**Interfaces:**

- Produces: `GroupDigitalProduct`, `GroupDigitalCapability`, `groupDigitalProducts`, and `groupDigitalCapabilities`.
- `GroupDigitalProduct.emphasis` is exactly `'primary' | 'secondary'`.
- `GroupDigitalProduct.id` is exactly `'compass' | 'crm' | 'club'`.
- `GroupDigitalCapability.id` is exactly `'management' | 'engagement' | 'coordination' | 'delivery'`.
- Task 2 consumes both exported arrays without transforming or duplicating their copy.

- [ ] **Step 1: Add the page-private data types**

Add to `apps/brand/src/pages/group/types.ts`:

```ts
export interface GroupDigitalProduct {
  readonly description: string
  readonly emphasis: 'primary' | 'secondary'
  readonly englishName: string
  readonly href: string
  readonly id: 'compass' | 'crm' | 'club'
  readonly name: string
}

export interface GroupDigitalCapability {
  readonly description: string
  readonly id: 'management' | 'engagement' | 'coordination' | 'delivery'
  readonly name: string
}
```

- [ ] **Step 2: Add the exact product and capability records**

Import the new types into `apps/brand/src/pages/group/data.ts` and define the following exports immediately after `groupIndustries`:

```ts
export const groupDigitalProducts: readonly GroupDigitalProduct[] = [
  {
    description: '连接订单、商品、库存、履约、财务与经营分析，让跨境电商业务在一套系统中清晰协同。',
    emphasis: 'primary',
    englishName: 'GAOGE COMPASS',
    href: 'https://compass.gaoge.cc?demo',
    id: 'compass',
    name: '高歌跨境 ERP',
  },
  {
    description: '围绕线索、客户、商机与跟进过程，帮助销售团队持续记录和推进客户关系。',
    emphasis: 'secondary',
    englishName: 'GAOGE CRM',
    href: 'https://crm.gaoge.cc?demo',
    id: 'crm',
    name: '高歌客户 CRM',
  },
  {
    description: '面向会员、活动与社群关系，让俱乐部的连接、参与和日常运营更顺畅。',
    emphasis: 'secondary',
    englishName: 'GAOGE CLUB',
    href: 'https://club.gaoge.cc?demo',
    id: 'club',
    name: '高歌 Club',
  },
]

export const groupDigitalCapabilities: readonly GroupDigitalCapability[] = [
  {
    description: '围绕经营、销售、库存、履约与协作，构建贴合业务流程的管理产品。',
    id: 'management',
    name: '企业管理系统',
  },
  {
    description: '连接线索、客户、会员、活动与服务，形成可持续运营的数字触点。',
    id: 'engagement',
    name: '客户与会员运营',
  },
  {
    description: '梳理跨部门流程，连接已有系统与数据，让信息流转更清晰。',
    id: 'coordination',
    name: '业务流程与数据协同',
  },
  {
    description: '支持 Web、桌面、移动与小程序，并可按需要提供独立部署。',
    id: 'delivery',
    name: '多端交付与独立部署',
  },
]
```

- [ ] **Step 3: Add data-contract assertions**

Add `groupDigitalCapabilities` and `groupDigitalProducts` to the import from `./data`, then add these tests inside `describe('group organization data', ...)`:

```ts
it('defines one primary and two secondary digital demo products', () => {
  expect(groupDigitalProducts).toEqual([
    {
      description:
        '连接订单、商品、库存、履约、财务与经营分析，让跨境电商业务在一套系统中清晰协同。',
      emphasis: 'primary',
      englishName: 'GAOGE COMPASS',
      href: 'https://compass.gaoge.cc?demo',
      id: 'compass',
      name: '高歌跨境 ERP',
    },
    {
      description: '围绕线索、客户、商机与跟进过程，帮助销售团队持续记录和推进客户关系。',
      emphasis: 'secondary',
      englishName: 'GAOGE CRM',
      href: 'https://crm.gaoge.cc?demo',
      id: 'crm',
      name: '高歌客户 CRM',
    },
    {
      description: '面向会员、活动与社群关系，让俱乐部的连接、参与和日常运营更顺畅。',
      emphasis: 'secondary',
      englishName: 'GAOGE CLUB',
      href: 'https://club.gaoge.cc?demo',
      id: 'club',
      name: '高歌 Club',
    },
  ])
})

it('defines four customer-facing digital capability directions', () => {
  expect(groupDigitalCapabilities).toEqual([
    {
      description: '围绕经营、销售、库存、履约与协作，构建贴合业务流程的管理产品。',
      id: 'management',
      name: '企业管理系统',
    },
    {
      description: '连接线索、客户、会员、活动与服务，形成可持续运营的数字触点。',
      id: 'engagement',
      name: '客户与会员运营',
    },
    {
      description: '梳理跨部门流程，连接已有系统与数据，让信息流转更清晰。',
      id: 'coordination',
      name: '业务流程与数据协同',
    },
    {
      description: '支持 Web、桌面、移动与小程序，并可按需要提供独立部署。',
      id: 'delivery',
      name: '多端交付与独立部署',
    },
  ])
})
```

- [ ] **Step 4: Run the focused data test**

Run:

```bash
pnpm --filter @gaoge/app-brand test -- src/pages/group/data.test.ts
```

Expected: PASS with both new data-contract tests and all existing group data tests green.

### Task 2: Build and wire the Gaoge Digital section

**Files:**

- Create: `apps/brand/src/pages/group/components/DigitalStructure.tsx`
- Modify: `apps/brand/src/pages/group/GroupPage.tsx`
- Modify: `apps/brand/src/App.test.tsx`

**Interfaces:**

- Consumes: `readonly GroupDigitalProduct[]` and `readonly GroupDigitalCapability[]` from Task 1.
- Produces: a section labeled by `digital-structure-title`, three `data-testid="group-digital-product"` links, and four `data-testid="group-digital-capability"` list items.
- Preserves: existing `/group` metadata, `BrandPageShell current="group"`, sports external links, leadership cards, league board, group vision, and footer.

- [ ] **Step 1: Create the DigitalStructure component**

Create `apps/brand/src/pages/group/components/DigitalStructure.tsx` using the complete component source in the subsection below, then proceed directly to wiring and assertions before running tests.

- [ ] **Step 2: Insert the section into GroupPage**

Update `apps/brand/src/pages/group/GroupPage.tsx` to import `DigitalStructure`, `groupDigitalCapabilities`, and `groupDigitalProducts`, then render the new component in this exact order:

```tsx
<GroupHero industries={groupIndustries} />
<DigitalStructure capabilities={groupDigitalCapabilities} products={groupDigitalProducts} />
<SportsStructure entities={sportsEntities} />
```

Do not reorder or change the remaining leadership, board, or vision components.

- [ ] **Step 3: Add route assertions for content, order, hierarchy, and links**

In the existing `renders the public group structure and metadata` test in `apps/brand/src/App.test.tsx`, insert these assertions immediately before the current `expect(screen.getByText('因热爱相聚'))` sports assertion:

```ts
expect(screen.getByText('以数字连接业务')).toBeInTheDocument()
const digitalHeading = screen.getByRole('heading', { name: '高歌数字' })
const sportsHeading = screen.getByRole('heading', { name: '高歌体育' })
expect(digitalHeading.compareDocumentPosition(sportsHeading)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
expect(
  screen.getByText('从真实业务出发，把复杂流程变成清晰、可持续使用的数字产品。'),
).toBeInTheDocument()

const digitalProductCards = screen.getAllByTestId('group-digital-product')
expect(digitalProductCards).toHaveLength(3)
expect(digitalProductCards.map((card) => card.getAttribute('data-product'))).toEqual([
  'compass',
  'crm',
  'club',
])
expect(digitalProductCards[0]).toHaveAttribute('data-emphasis', 'primary')
expect(digitalProductCards.slice(1).every((card) => card.dataset.emphasis === 'secondary')).toBe(
  true,
)
;[
  ['高歌跨境 ERP', 'https://compass.gaoge.cc?demo'],
  ['高歌客户 CRM', 'https://crm.gaoge.cc?demo'],
  ['高歌 Club', 'https://club.gaoge.cc?demo'],
].forEach(([name, href]) => {
  const link = screen.getByRole('link', {
    name: `${name}，进入演示系统，将在新窗口打开`,
  })
  expect(link).toHaveAttribute('href', href)
  expect(link).toHaveAttribute('target', '_blank')
  expect(link).toHaveAttribute('rel', 'noopener noreferrer')
})

expect(screen.getAllByText('演示系统')).toHaveLength(3)
expect(screen.getAllByTestId('group-digital-capability')).toHaveLength(4)
;['企业管理系统', '客户与会员运营', '业务流程与数据协同', '多端交付与独立部署'].forEach(
  (capability) => {
    expect(screen.getByRole('heading', { name: capability })).toBeInTheDocument()
  },
)
```

**Complete source for Step 1:**

Create `apps/brand/src/pages/group/components/DigitalStructure.tsx` with this structure:

```tsx
import { ArrowUpRight } from 'lucide-react'

import type { GroupDigitalCapability, GroupDigitalProduct } from '@/pages/group/types'

interface DigitalStructureProps {
  readonly capabilities: readonly GroupDigitalCapability[]
  readonly products: readonly GroupDigitalProduct[]
}

function DigitalProductCard({ product }: { readonly product: GroupDigitalProduct }) {
  const isPrimary = product.emphasis === 'primary'

  return (
    <a
      aria-label={`${product.name}，进入演示系统，将在新窗口打开`}
      className={`group relative flex min-h-56 flex-col justify-between overflow-hidden rounded-[24px] border border-white/10 bg-[rgb(var(--brand-surface)/0.72)] p-6 transition-[border-color,transform] duration-300 hover:-translate-y-1 hover:border-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[rgb(var(--brand-accent))] active:translate-y-0 md:p-7 ${
        isPrimary ? 'lg:col-span-7 lg:row-span-2 lg:min-h-[30rem]' : 'lg:col-span-5 lg:min-h-0'
      }`}
      data-emphasis={product.emphasis}
      data-product={product.id}
      data-testid="group-digital-product"
      href={product.href}
      rel="noopener noreferrer"
      target="_blank"
    >
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute rounded-full bg-[rgb(var(--brand-accent)/0.1)] blur-3xl ${
          isPrimary ? '-right-20 -top-24 h-72 w-72' : '-right-12 -top-16 h-40 w-40'
        }`}
      />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.18em] text-white/45">{product.englishName}</p>
          <span className="mt-3 inline-flex rounded-full border border-white/10 px-3 py-1 text-xs text-white/55">
            演示系统
          </span>
        </div>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 text-white/45 transition-colors group-hover:border-white/20 group-hover:bg-white/[0.06] group-hover:text-white">
          <ArrowUpRight aria-hidden="true" size={16} strokeWidth={1.5} />
        </span>
      </div>
      <div className="relative mt-16">
        <h3
          className={`font-medium tracking-[-0.05em] text-white ${
            isPrimary ? 'text-4xl md:text-6xl' : 'text-3xl md:text-4xl'
          }`}
        >
          {product.name}
        </h3>
        <p
          className={`mt-4 text-sm leading-7 text-[rgb(var(--brand-muted))] ${isPrimary ? 'max-w-xl' : 'max-w-md'}`}
        >
          {product.description}
        </p>
      </div>
    </a>
  )
}

export default function DigitalStructure({ capabilities, products }: DigitalStructureProps) {
  return (
    <section
      aria-labelledby="digital-structure-title"
      className="mx-auto max-w-7xl px-6 py-16 md:px-10 md:py-24"
    >
      <div className="max-w-2xl">
        <p className="mb-4 text-sm text-[rgb(var(--brand-accent))]">以数字连接业务</p>
        <h2
          className="text-4xl font-medium tracking-[-0.06em] text-white md:text-6xl"
          id="digital-structure-title"
        >
          高歌数字
        </h2>
        <p className="mt-5 max-w-lg text-sm leading-7 text-[rgb(var(--brand-muted))] md:text-base">
          从真实业务出发，把复杂流程变成清晰、可持续使用的数字产品。
        </p>
      </div>

      <div className="mt-10 grid gap-4 md:mt-12 lg:grid-cols-12 lg:grid-rows-2">
        {products.map((product) => (
          <DigitalProductCard key={product.id} product={product} />
        ))}
      </div>

      <div className="mt-12 border-t border-white/10 pt-8 md:mt-16 md:pt-10">
        <p className="text-sm text-white/55">我们可以提供</p>
        <ul className="mt-6 grid gap-px overflow-hidden rounded-[20px] border border-white/10 bg-white/10 md:grid-cols-2 lg:grid-cols-4">
          {capabilities.map((capability) => (
            <li
              className="bg-[rgb(var(--brand-background))] p-5 md:p-6"
              data-testid="group-digital-capability"
              key={capability.id}
            >
              <h3 className="text-base font-medium text-white">{capability.name}</h3>
              <p className="mt-3 text-sm leading-6 text-[rgb(var(--brand-muted))]">
                {capability.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
```

If Prettier wraps the long product-description class expression, accept its formatting; do not extract a shared class helper solely for line length.

- [ ] **Step 4: Run the focused group tests**

Run:

```bash
pnpm --filter @gaoge/app-brand test -- src/pages/group/data.test.ts src/App.test.tsx
```

Expected: PASS. The route test must still find the two sports links, three leaders, twenty directors, and group vision after the new digital assertions.

### Task 3: Verify code quality and responsive presentation

**Files:**

- Verify: `apps/brand/src/pages/group/types.ts`
- Verify: `apps/brand/src/pages/group/data.ts`
- Verify: `apps/brand/src/pages/group/data.test.ts`
- Verify: `apps/brand/src/pages/group/components/DigitalStructure.tsx`
- Verify: `apps/brand/src/pages/group/GroupPage.tsx`
- Verify: `apps/brand/src/App.test.tsx`

**Interfaces:**

- Consumes: the completed implementation from Tasks 1 and 2.
- Produces: verified source suitable for the existing dirty worktree, without staging or committing unrelated user changes.

- [ ] **Step 1: Format only task-owned files**

Run:

```bash
pnpm exec prettier --write \
  apps/brand/src/pages/group/types.ts \
  apps/brand/src/pages/group/data.ts \
  apps/brand/src/pages/group/data.test.ts \
  apps/brand/src/pages/group/components/DigitalStructure.tsx \
  apps/brand/src/pages/group/GroupPage.tsx \
  apps/brand/src/App.test.tsx
```

Expected: all six files are formatted. Review the resulting diff to confirm the formatter did not alter unrelated portions beyond necessary formatting.

- [ ] **Step 2: Run focused tests, typecheck, build, and style lint**

Run each command separately so any failure has an unambiguous source:

```bash
pnpm --filter @gaoge/app-brand test -- src/pages/group/data.test.ts src/App.test.tsx
pnpm --filter @gaoge/app-brand typecheck
pnpm --filter @gaoge/app-brand build
pnpm lint:style
```

Expected: all commands exit with status 0. If `pnpm lint:style` reports an unrelated pre-existing failure, record the exact file and rule; do not change unrelated styles.

- [ ] **Step 3: Inspect the task diff and preserve user work**

Run:

```bash
git diff --check -- \
  apps/brand/src/pages/group/types.ts \
  apps/brand/src/pages/group/data.ts \
  apps/brand/src/pages/group/data.test.ts \
  apps/brand/src/pages/group/components/DigitalStructure.tsx \
  apps/brand/src/pages/group/GroupPage.tsx \
  apps/brand/src/App.test.tsx

git status --short
```

Expected: no whitespace errors. Existing modified files outside the task remain present and untouched.

- [ ] **Step 4: Perform browser checks at desktop and mobile widths**

Start the existing Brand dev server with `pnpm dev:brand`, open `/group`, and inspect at approximately 1440px and 390px widths. Confirm:

- Gaoge Digital appears after the group hero and before Gaoge Sports.
- Desktop shows one visually dominant Compass card and two smaller cards without empty grid gaps.
- Mobile order is Compass, CRM, Club.
- All three cards visibly say “演示系统” and open the expected `?demo` URL in a new window.
- Product descriptions wrap without clipping.
- The capability list changes from four columns to two columns and then one column.
- Keyboard focus is visible on every product card.
- No horizontal overflow is introduced.

- [ ] **Step 5: Run the knowledge impact check before completion**

Call `impact_for_changes` for repository `gaoge` with these paths:

```text
apps/brand/src/pages/group/types.ts
apps/brand/src/pages/group/data.ts
apps/brand/src/pages/group/data.test.ts
apps/brand/src/pages/group/components/DigitalStructure.tsx
apps/brand/src/pages/group/GroupPage.tsx
apps/brand/src/App.test.tsx
```

Expected: report any affected knowledge pages, note that `context_for_repo("gaoge")` currently lacks an accurate source map, and recommend `kb-maintainer` follow-up only if the impact result identifies durable knowledge drift.
