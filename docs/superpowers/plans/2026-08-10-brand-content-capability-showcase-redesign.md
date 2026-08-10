# GAOGE Content Capability Showcase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `/content`'s product-like operating matrix with an eight-section capability showcase that proves GAOGE's content creation, all-platform operation, and community-connection capabilities without product or account links.

**Architecture:** Keep `ContentPage.tsx` as the composition root and `data.ts` as the page's single static content source. Replace the three matrix sections with focused page-private narrative components, extend the existing content section navigation to eight stable anchors, and retain `BrandPageShell`, `ContentHero`, `ContentSectionReveal`, Tailwind CSS, and Framer Motion. Remove old matrix components only after the new composition no longer imports them.

**Tech Stack:** React 18, TypeScript 5.9, React Router 6, Tailwind CSS 3, Framer Motion 12, Vitest 3, Testing Library, Vite 6

## Global Constraints

- Keep the route exactly `/content`.
- Keep the hero copy exactly `GAOGE CONTENT`, `让每一份热爱持续被看见。`, and `以内容与运营连接品牌、平台和真实社群。`.
- Use exactly eight sections in this order: brand statement, content belief, core capabilities, real practice, content formats, all-platform operation, method, long-term value.
- Treat 高歌体育、高歌超级联赛、主理人内容实践 as static capability evidence; render no status, body link, external-link arrow, or product-card feedback for them.
- Show exactly these platforms: 公众号、视频号、小红书、抖音、B 站、社群与私域.
- Show exactly these all-platform capabilities: 统一主题规划、平台原生适配、协同发布运营、互动与社群承接、数据观察复盘.
- Do not invent account names, platform destinations, follower counts, view counts, growth rates, clients, or delivery promises.
- Preserve the content warm-red accent, existing Brand shell/navigation/footer, the footer link to `/digital`, and the page-private reduced-motion behavior.
- Add no UI, icon, animation, CMS, or API dependency.
- Use Tailwind CSS for ordinary layout and styling; reserve `styles.css` for content-scoped surfaces, complex relationships, media queries, and system-preference fallbacks.
- Support 320px and wider without page-level horizontal overflow.
- Current source behavior overrides stale planning details. Do not change `/digital`, `/group`, home, Sports, or Concepts behavior.
- Follow the repository preference of feature-level contract tests plus final verification; do not introduce strict test-first steps for purely visual CSS.

---

## File Map

### Static content

- Modify `apps/brand/src/pages/content/data.ts`: replace product-like `ContentProperty` data with typed content beliefs, capabilities, practices, formats, platform operations, method steps, and values.
- Modify `apps/brand/src/pages/content/data.test.ts`: enforce the exact content inventory, confirmed local imagery, absence of links/statuses, and platform capability contract.
- Keep `apps/brand/src/pages/content/config.ts`: retain `ContentPlatform` and `platformLabels` as the canonical platform identifier mapping.

### Page-private presentation

- Keep/modify `apps/brand/src/pages/content/components/ContentHero.tsx`: preserve approved hero copy and real local imagery while aligning its section label to the new navigation.
- Create `apps/brand/src/pages/content/components/ContentBelief.tsx`: render the content philosophy and three beliefs.
- Create `apps/brand/src/pages/content/components/ContentCapabilities.tsx`: render the four core capability areas.
- Create `apps/brand/src/pages/content/components/ContentPractice.tsx`: render three noninteractive evidence blocks with real imagery.
- Create `apps/brand/src/pages/content/components/ContentFormats.tsx`: render the eight-format editorial wall.
- Create `apps/brand/src/pages/content/components/ContentPlatformOperations.tsx`: render six platform contexts and five operation capabilities.
- Create `apps/brand/src/pages/content/components/ContentMethod.tsx`: render the six-stage operating path.
- Create `apps/brand/src/pages/content/components/ContentValue.tsx`: render the three long-term outcomes and closing line.
- Create `apps/brand/src/pages/content/components/ContentSections.test.tsx`: component-level semantic tests for the seven new sections.
- Modify `apps/brand/src/pages/content/components/ContentSectionNavigation.tsx`: observe and link to eight stable section IDs.
- Keep `apps/brand/src/pages/content/components/ContentSectionReveal.tsx` and its existing test unchanged unless verification exposes a regression.

### Composition and cleanup

- Modify `apps/brand/src/pages/content/ContentPage.tsx`: update metadata and compose the eight sections.
- Modify `apps/brand/src/App.test.tsx`: replace the old content-matrix route contract with the new capability-showcase contract.
- Delete `apps/brand/src/pages/content/components/CurrentContent.tsx` after it is no longer imported.
- Delete `apps/brand/src/pages/content/components/ContentPlatforms.tsx` after it is no longer imported.
- Delete `apps/brand/src/pages/content/components/ContentOperatingLoop.tsx` after it is no longer imported.
- Delete `apps/brand/src/pages/content/components/ContentPropertyBlock.tsx` after confirming it has no remaining imports.
- Delete `apps/brand/src/pages/content/components/PlatformRail.tsx` after confirming it has no remaining imports.
- Modify `apps/brand/src/styles.css`: replace old matrix selectors with content-showcase surfaces, relationship lines, responsive layouts, and preference fallbacks.

---

### Task 1: Replace the content matrix data contract

**Files:**

- Modify: `apps/brand/src/pages/content/data.ts`
- Modify: `apps/brand/src/pages/content/data.test.ts`
- Keep: `apps/brand/src/pages/content/config.ts`

**Interfaces:**

- Consumes: `ContentPlatform` and `platformLabels` from `config.ts`.
- Produces: `ContentVisual`, `ContentBelief`, `ContentCapability`, `ContentPracticeItem`, `ContentFormat`, `ContentPlatformOperation`, `ContentOperationCapability`, `ContentMethodStep`; plus `contentBeliefs`, `contentCoreCapabilities`, `contentPractices`, `contentFormats`, `contentPlatformOperations`, `contentOperationCapabilities`, `contentMethodSteps`, and `contentValues`.

- [ ] **Step 1: Replace the old data tests with the approved capability contract**

Write `data.test.ts` around the exported arrays rather than component markup:

```ts
import { describe, expect, it } from 'vitest'

import {
  contentBeliefs,
  contentCoreCapabilities,
  contentFormats,
  contentMethodSteps,
  contentOperationCapabilities,
  contentPlatformOperations,
  contentPractices,
  contentValues,
} from '@/pages/content/data'

describe('content capability showcase data', () => {
  it('defines the approved page inventory', () => {
    expect(contentBeliefs.map(({ title }) => title)).toEqual([
      '发现真实故事',
      '建立长期表达',
      '连接真实社群',
    ])
    expect(contentCoreCapabilities.map(({ title }) => title)).toEqual([
      '内容策略',
      '内容创作',
      '现场表达',
      '运营连接',
    ])
    expect(contentFormats.map(({ label }) => label)).toEqual([
      '人物故事',
      '赛事记录',
      '品牌专题',
      '图文内容',
      '短视频',
      '活动现场',
      '社群内容',
      '长期栏目',
    ])
    expect(contentMethodSteps.map(({ title }) => title)).toEqual([
      '洞察',
      '策划',
      '创作',
      '发布',
      '连接',
      '复盘',
    ])
    expect(contentValues).toHaveLength(3)
  })

  it('keeps real practices non-navigational and backed by local imagery', () => {
    expect(contentPractices.map(({ name }) => name)).toEqual([
      '高歌体育',
      '高歌超级联赛',
      '主理人内容实践',
    ])
    contentPractices.forEach((practice) => {
      expect(practice.visual.src).toMatch(/^\/assets\/brand\/.+\.(jpg|webp)$/)
      expect(practice.visual.alt).toBeTruthy()
      expect(Object.hasOwn(practice, 'href')).toBe(false)
      expect(Object.hasOwn(practice, 'status')).toBe(false)
      expect(Object.hasOwn(practice, 'platforms')).toBe(false)
    })
  })

  it('defines the confirmed all-platform operating capability', () => {
    expect(contentPlatformOperations.map(({ platform }) => platform)).toEqual([
      'wechat',
      'channels',
      'xiaohongshu',
      'douyin',
      'bilibili',
      'community',
    ])
    expect(contentOperationCapabilities.map(({ title }) => title)).toEqual([
      '统一主题规划',
      '平台原生适配',
      '协同发布运营',
      '互动与社群承接',
      '数据观察复盘',
    ])
  })
})
```

- [ ] **Step 2: Run the focused data test and verify the old exports fail the new contract**

Run:

```bash
pnpm --filter @gaoge/app-brand test -- src/pages/content/data.test.ts
```

Expected: FAIL because the new exports do not exist and the current practice data still contains `href`, `status`, and `platforms`.

- [ ] **Step 3: Add the typed capability-showcase source alongside the legacy matrix exports**

Add the following public shapes and approved values to `data.ts`. Keep the existing `ContentProperty`, `contentProperties`, and string-valued `contentCapabilities` exports temporarily so the still-mounted old page remains type-safe through Tasks 2–4. Preserve the three existing local asset paths exactly; Task 5 removes the legacy exports together with their final consumers.

```ts
import type { ContentPlatform } from '@/pages/content/config'

export interface ContentVisual {
  readonly alt: string
  readonly src: string
}

export interface ContentBelief {
  readonly description: string
  readonly title: string
}

export interface ContentCapability extends ContentBelief {
  readonly label: string
}

export interface ContentPracticeItem {
  readonly name: string
  readonly proof: string
  readonly summary: string
  readonly visual: ContentVisual
}

export interface ContentFormat {
  readonly label: string
  readonly visual?: ContentVisual
}

export interface ContentPlatformOperation {
  readonly focus: string
  readonly platform: ContentPlatform
}

export interface ContentOperationCapability extends ContentBelief {
  readonly label: string
}

export type ContentMethodStep = ContentBelief

export const contentBeliefs: readonly ContentBelief[] = [
  { title: '发现真实故事', description: '从人物、赛事、品牌和社群中，找到值得长期表达的内容。' },
  { title: '建立长期表达', description: '形成稳定的主题、语言、视觉与内容节奏。' },
  { title: '连接真实社群', description: '让内容进入讨论、参与和关系沉淀，而不只获得一次曝光。' },
]

export const contentCoreCapabilities: readonly ContentCapability[] = [
  {
    label: '01 · STRATEGY',
    title: '内容策略',
    description: '品牌内容定位、主题规划、栏目体系与传播节奏。',
  },
  {
    label: '02 · CREATION',
    title: '内容创作',
    description: '人物采访、赛事记录、图文策划、短视频与专题内容。',
  },
  {
    label: '03 · LIVE STORYTELLING',
    title: '现场表达',
    description: '赛事和活动现场记录、即时内容生产与氛围塑造。',
  },
  {
    label: '04 · OPERATION',
    title: '运营连接',
    description: '平台运营、内容发布、互动维护、社群承接与持续复盘。',
  },
]

const sportsVisual: ContentVisual = {
  alt: '高歌体育品牌内容视觉',
  src: '/assets/brand/gaoge-sports-share.jpg',
}

const leagueVisual: ContentVisual = {
  alt: '夜间球场灯光下进行的高歌超级联赛',
  src: '/assets/brand/content-league-atmosphere.jpg',
}

const creatorVisual: ContentVisual = {
  alt: '桌面上的相机、笔记与内容创作工具',
  src: '/assets/brand/content-creator-practice.jpg',
}

export const contentPractices: readonly ContentPracticeItem[] = [
  {
    name: '高歌体育',
    summary: '围绕体育文化，持续记录赛事、人物与真实现场。',
    proof: '品牌内容体系、多形态创作、持续运营。',
    visual: sportsVisual,
  },
  {
    name: '高歌超级联赛',
    summary: '从赛事发生到传播扩散，建立完整的内容现场。',
    proof: '赛事叙事、活动传播、社群连接。',
    visual: leagueVisual,
  },
  {
    name: '主理人内容实践',
    summary: '将产品、体育和长期实践转化为个人化表达。',
    proof: '个人 IP 定位、观点表达、长期栏目。',
    visual: creatorVisual,
  },
]

export const contentFormats: readonly ContentFormat[] = [
  { label: '人物故事', visual: creatorVisual },
  { label: '赛事记录', visual: leagueVisual },
  { label: '品牌专题', visual: sportsVisual },
  { label: '图文内容' },
  { label: '短视频' },
  { label: '活动现场', visual: leagueVisual },
  { label: '社群内容' },
  { label: '长期栏目', visual: creatorVisual },
]

export const contentPlatformOperations: readonly ContentPlatformOperation[] = [
  { platform: 'wechat', focus: '深度内容与品牌沉淀' },
  { platform: 'channels', focus: '即时触达与社交传播' },
  { platform: 'xiaohongshu', focus: '场景表达与兴趣发现' },
  { platform: 'douyin', focus: '短视频叙事与广泛触达' },
  { platform: 'bilibili', focus: '中长内容与兴趣沉淀' },
  { platform: 'community', focus: '互动承接与长期关系' },
]

export const contentOperationCapabilities: readonly ContentOperationCapability[] = [
  {
    label: '01 · ALIGN',
    title: '统一主题规划',
    description: '保持品牌主张、内容主题和阶段目标一致。',
  },
  {
    label: '02 · ADAPT',
    title: '平台原生适配',
    description: '根据用户习惯调整标题、比例、节奏和内容结构。',
  },
  {
    label: '03 · PUBLISH',
    title: '协同发布运营',
    description: '建立发布节奏，让不同平台共同完成传播目标。',
  },
  {
    label: '04 · CONNECT',
    title: '互动与社群承接',
    description: '回应讨论，把平台触达转化为持续关系。',
  },
  {
    label: '05 · LEARN',
    title: '数据观察复盘',
    description: '理解内容反馈，持续修正下一轮选题和表达。',
  },
]

export const contentMethodSteps: readonly ContentMethodStep[] = [
  { title: '洞察', description: '理解品牌、人物、事件与社群。' },
  { title: '策划', description: '建立主题、栏目与表达结构。' },
  { title: '创作', description: '选择适合故事的内容形态。' },
  { title: '发布', description: '适配不同平台和传播场景。' },
  { title: '连接', description: '回应互动并承接真实社群。' },
  { title: '复盘', description: '沉淀反馈，修正下一轮方向。' },
]

export const contentValues = [
  '可持续积累的品牌内容资产',
  '稳定、统一且具有辨识度的表达',
  '品牌与真实人物、社群之间的长期连接',
] as const
```

- [ ] **Step 4: Run the data test and typecheck**

Run:

```bash
pnpm --filter @gaoge/app-brand test -- src/pages/content/data.test.ts
pnpm --filter @gaoge/app-brand typecheck
```

Expected: the data test and typecheck PASS. The legacy exports remain only to keep the old mounted composition valid until Task 5.

- [ ] **Step 5: Commit the data contract**

```bash
git add apps/brand/src/pages/content/data.ts apps/brand/src/pages/content/data.test.ts
git commit -m "refactor(brand): define content capability data"
```

---

### Task 2: Build the belief and core-capability sections

**Files:**

- Create: `apps/brand/src/pages/content/components/ContentBelief.tsx`
- Create: `apps/brand/src/pages/content/components/ContentCapabilities.tsx`
- Create: `apps/brand/src/pages/content/components/ContentSections.test.tsx`
- Modify: `apps/brand/src/pages/content/components/ContentHero.tsx`

**Interfaces:**

- Consumes: `readonly ContentBelief[]` and `readonly ContentCapability[]` from Task 1.
- Produces: `ContentBelief({ beliefs })` with section ID `content-belief`; `ContentCapabilities({ capabilities })` with section ID `content-capabilities`; existing `ContentHero` with section ID `content-overview`.

- [ ] **Step 1: Add semantic tests for the opening narrative sections**

Create `ContentSections.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import ContentBelief from './ContentBelief'
import ContentCapabilities from './ContentCapabilities'
import { contentBeliefs, contentCoreCapabilities } from '../data'

describe('content capability sections', () => {
  it('explains the content belief and four core capabilities', () => {
    render(
      <>
        <ContentBelief beliefs={contentBeliefs} />
        <ContentCapabilities capabilities={contentCoreCapabilities} />
      </>,
    )

    expect(
      screen.getByRole('heading', { name: '内容不是一次传播，而是持续建立关系。' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '从内容发生，到关系留下。' })).toBeInTheDocument()
    contentBeliefs.forEach(({ title }) =>
      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument(),
    )
    contentCoreCapabilities.forEach(({ title }) =>
      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument(),
    )
    expect(screen.getByTestId('content-belief')).toHaveAttribute('id', 'content-belief')
    expect(screen.getByTestId('content-capabilities')).toHaveAttribute('id', 'content-capabilities')
  })
})
```

- [ ] **Step 2: Run the section test and verify missing components fail**

Run:

```bash
pnpm --filter @gaoge/app-brand test -- src/pages/content/components/ContentSections.test.tsx
```

Expected: FAIL because both components do not exist.

- [ ] **Step 3: Implement `ContentBelief`**

Use a two-column section: editorial statement on the left, three restrained belief rows on the right.

```tsx
import type { ContentBelief as ContentBeliefItem } from '@/pages/content/data'

interface ContentBeliefProps {
  readonly beliefs: readonly ContentBeliefItem[]
}

export default function ContentBelief({ beliefs }: ContentBeliefProps) {
  return (
    <section
      className="content-page-section mx-auto grid max-w-[1600px] gap-12 px-6 py-20 md:px-10 md:py-28 lg:grid-cols-[0.9fr_1.1fr] lg:items-center"
      data-testid="content-belief"
      id="content-belief"
    >
      <header className="max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[rgb(var(--brand-accent))]">
          What content means
        </p>
        <h2 className="mt-3 text-4xl font-medium leading-[1.02] tracking-[-0.055em] text-white md:text-6xl">
          内容不是一次传播，
          <br />
          而是持续建立关系。
        </h2>
      </header>
      <div className="content-belief-list">
        {beliefs.map((belief) => (
          <article className="content-belief-item py-6" key={belief.title}>
            <h3 className="text-xl font-medium tracking-[-0.035em] text-white">{belief.title}</h3>
            <p className="mt-3 max-w-lg text-sm leading-7 text-[rgb(var(--brand-muted))]">
              {belief.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Implement `ContentCapabilities`**

Render one contained 2×2 field rather than four disconnected service cards:

```tsx
import type { ContentCapability } from '@/pages/content/data'

interface ContentCapabilitiesProps {
  readonly capabilities: readonly ContentCapability[]
}

export default function ContentCapabilities({ capabilities }: ContentCapabilitiesProps) {
  return (
    <section
      className="content-page-section mx-auto max-w-[1600px] px-6 py-20 md:px-10 md:py-28"
      data-testid="content-capabilities"
      id="content-capabilities"
    >
      <header className="max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[rgb(var(--brand-accent))]">
          What we can do
        </p>
        <h2 className="mt-3 text-4xl font-medium leading-[1.02] tracking-[-0.055em] text-white md:text-6xl">
          从内容发生，
          <br />
          到关系留下。
        </h2>
      </header>
      <div className="content-capability-grid mt-10 grid overflow-hidden rounded-[24px] md:grid-cols-2">
        {capabilities.map((capability) => (
          <article className="content-capability-item min-h-56 p-6 md:p-8" key={capability.title}>
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[rgb(var(--brand-accent))]">
              {capability.label}
            </p>
            <h3 className="mt-12 text-2xl font-medium tracking-[-0.04em] text-white">
              {capability.title}
            </h3>
            <p className="mt-3 max-w-sm text-sm leading-7 text-[rgb(var(--brand-muted))]">
              {capability.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 5: Keep the hero contract exact**

In `ContentHero.tsx`, keep `id="content-overview"`, the three approved text strings, the local `/assets/brand/content-league-atmosphere.jpg` image, and the existing reduced-motion entrance. Change only comments or section-specific classes needed by the new visual system; do not add a CTA.

- [ ] **Step 6: Run the component test**

```bash
pnpm --filter @gaoge/app-brand test -- src/pages/content/components/ContentSections.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit the opening narrative sections**

```bash
git add apps/brand/src/pages/content/components/ContentHero.tsx apps/brand/src/pages/content/components/ContentBelief.tsx apps/brand/src/pages/content/components/ContentCapabilities.tsx apps/brand/src/pages/content/components/ContentSections.test.tsx
git commit -m "feat(brand): add content narrative sections"
```

---

### Task 3: Build real practice and content-format evidence

**Files:**

- Create: `apps/brand/src/pages/content/components/ContentPractice.tsx`
- Create: `apps/brand/src/pages/content/components/ContentFormats.tsx`
- Modify: `apps/brand/src/pages/content/components/ContentSections.test.tsx`

**Interfaces:**

- Consumes: `readonly ContentPracticeItem[]` and `readonly ContentFormat[]` from Task 1; `MediaWithFallback` from `@/brand/components/MediaWithFallback`.
- Produces: `ContentPractice({ practices })` with section ID `content-practice`; `ContentFormats({ formats })` with section ID `content-formats`.

- [ ] **Step 1: Extend the section contract test**

Add imports, render both sections, and add these assertions to the existing test file:

```tsx
import ContentFormats from './ContentFormats'
import ContentPractice from './ContentPractice'
import { contentFormats, contentPractices } from '../data'

const { container } = render(
  <>
    <ContentPractice practices={contentPractices} />
    <ContentFormats formats={contentFormats} />
  </>,
)

expect(screen.getByRole('heading', { name: '能力来自持续实践。' })).toBeInTheDocument()
expect(screen.getByRole('heading', { name: '让不同的故事，找到适合的表达。' })).toBeInTheDocument()
expect(screen.getAllByTestId('content-practice-item')).toHaveLength(3)
expect(container.querySelector('[data-testid="content-practice"] a')).not.toBeInTheDocument()
contentFormats.forEach(({ label }) => expect(screen.getByText(label)).toBeInTheDocument())
```

Keep one `render()` per `it()`; fold the new sections into the existing fragment instead of calling `render()` twice in the same test.

- [ ] **Step 2: Run the test and verify the new imports fail**

```bash
pnpm --filter @gaoge/app-brand test -- src/pages/content/components/ContentSections.test.tsx
```

Expected: FAIL because `ContentPractice` and `ContentFormats` do not exist.

- [ ] **Step 3: Implement noninteractive practice evidence**

Use one primary and two secondary editorial surfaces. Every item must be an `<article>`, never an `<a>`:

```tsx
import MediaWithFallback from '@/brand/components/MediaWithFallback'
import type { ContentPracticeItem } from '@/pages/content/data'

interface ContentPracticeProps {
  readonly practices: readonly ContentPracticeItem[]
}

export default function ContentPractice({ practices }: ContentPracticeProps) {
  return (
    <section
      className="content-page-section mx-auto max-w-[1600px] px-6 py-20 md:px-10 md:py-28"
      data-testid="content-practice"
      id="content-practice"
    >
      <header className="grid gap-5 md:grid-cols-[1fr_0.75fr] md:items-end">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[rgb(var(--brand-accent))]">
            Built through practice
          </p>
          <h2 className="mt-3 text-4xl font-medium leading-[1.02] tracking-[-0.055em] text-white md:text-6xl">
            能力来自
            <br />
            持续实践。
          </h2>
        </div>
        <p className="max-w-md text-sm leading-7 text-[rgb(var(--brand-muted))] md:justify-self-end">
          真实实践不是产品入口，而是内容能力持续形成的证据。
        </p>
      </header>
      <div className="content-practice-grid mt-10 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        {practices.map((practice, index) => (
          <article
            className={`content-practice-item relative overflow-hidden rounded-[24px] ${index === 0 ? 'min-h-[34rem] lg:row-span-2' : 'min-h-[16.5rem]'}`}
            data-testid="content-practice-item"
            key={practice.name}
          >
            <MediaWithFallback
              alt={practice.visual.alt}
              className="absolute inset-0 min-h-0 rounded-none"
              fallbackLabel={practice.name}
              src={practice.visual.src}
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/5"
            />
            <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
              <h3 className="text-2xl font-medium tracking-[-0.045em] text-white md:text-3xl">
                {practice.name}
              </h3>
              <p className="mt-3 max-w-md text-sm leading-7 text-white/65">{practice.summary}</p>
              <p className="text-white/48 mt-4 text-xs leading-6">
                <span className="text-white/72">能力证明：</span>
                {practice.proof}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Implement the asymmetric content-format wall**

Render eight items in a single editorial surface. Use `MediaWithFallback` only when `format.visual` exists; text-only items receive a content-scoped gradient surface, not a fabricated image.

```tsx
import MediaWithFallback from '@/brand/components/MediaWithFallback'
import type { ContentFormat } from '@/pages/content/data'

interface ContentFormatsProps {
  readonly formats: readonly ContentFormat[]
}

export default function ContentFormats({ formats }: ContentFormatsProps) {
  return (
    <section
      className="content-page-section mx-auto max-w-[1600px] px-6 py-20 md:px-10 md:py-28"
      data-testid="content-formats"
      id="content-formats"
    >
      <header className="max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[rgb(var(--brand-accent))]">
          Forms we work with
        </p>
        <h2 className="mt-3 text-4xl font-medium leading-[1.02] tracking-[-0.055em] text-white md:text-6xl">
          让不同的故事，
          <br />
          找到适合的表达。
        </h2>
      </header>
      <div className="content-format-wall mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
        {formats.map((format, index) => (
          <article
            className="content-format-item relative min-h-52 overflow-hidden rounded-[20px]"
            data-format-index={index + 1}
            key={format.label}
          >
            {format.visual ? (
              <MediaWithFallback
                alt=""
                className="absolute inset-0 min-h-0 rounded-none"
                fallbackLabel={format.label}
                src={format.visual.src}
              />
            ) : null}
            <div aria-hidden="true" className="content-format-shade absolute inset-0" />
            <h3 className="absolute inset-x-0 bottom-0 p-5 text-base font-medium tracking-[-0.025em] text-white">
              {format.label}
            </h3>
          </article>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 5: Run the component test**

```bash
pnpm --filter @gaoge/app-brand test -- src/pages/content/components/ContentSections.test.tsx
```

Expected: PASS, including the assertion that practice evidence contains no links.

- [ ] **Step 6: Commit the evidence sections**

```bash
git add apps/brand/src/pages/content/components/ContentPractice.tsx apps/brand/src/pages/content/components/ContentFormats.tsx apps/brand/src/pages/content/components/ContentSections.test.tsx
git commit -m "feat(brand): add content practice evidence"
```

---

### Task 4: Build all-platform operation, method, and value sections

**Files:**

- Create: `apps/brand/src/pages/content/components/ContentPlatformOperations.tsx`
- Create: `apps/brand/src/pages/content/components/ContentMethod.tsx`
- Create: `apps/brand/src/pages/content/components/ContentValue.tsx`
- Modify: `apps/brand/src/pages/content/components/ContentSections.test.tsx`

**Interfaces:**

- Consumes: `readonly ContentPlatformOperation[]`, `readonly ContentOperationCapability[]`, `readonly ContentMethodStep[]`, `readonly string[]`, and `platformLabels`.
- Produces: `ContentPlatformOperations({ platforms, capabilities })` with section ID `content-platform-operations`; `ContentMethod({ steps })` with section ID `content-method`; `ContentValue({ values })` with section ID `content-value`.

- [ ] **Step 1: Extend component coverage for the final three sections**

Render the new components in `ContentSections.test.tsx` and assert:

```tsx
expect(
  screen.getByRole('heading', { name: '一套内容策略，进入每一个适合的场域。' }),
).toBeInTheDocument()
expect(screen.getByRole('heading', { name: '让内容持续发生，也持续被理解。' })).toBeInTheDocument()
expect(screen.getByRole('heading', { name: '内容最终留下的，不只是曝光。' })).toBeInTheDocument()
expect(screen.getAllByTestId('content-platform')).toHaveLength(6)
expect(screen.getAllByTestId('content-operation-capability')).toHaveLength(5)
expect(screen.getAllByTestId('content-method-step')).toHaveLength(6)
expect(screen.getByText('让一次被看见，成为持续发生的关系。')).toBeInTheDocument()
```

- [ ] **Step 2: Run the test and verify missing components fail**

```bash
pnpm --filter @gaoge/app-brand test -- src/pages/content/components/ContentSections.test.tsx
```

Expected: FAIL because the three components do not exist.

- [ ] **Step 3: Implement `ContentPlatformOperations`**

The desktop visual uses one central content core plus six surrounding platform contexts. The DOM order remains linear, so mobile CSS can remove the relationship lines and render a list.

```tsx
import { platformLabels } from '@/pages/content/config'
import type { ContentOperationCapability, ContentPlatformOperation } from '@/pages/content/data'

interface ContentPlatformOperationsProps {
  readonly capabilities: readonly ContentOperationCapability[]
  readonly platforms: readonly ContentPlatformOperation[]
}

export default function ContentPlatformOperations({
  capabilities,
  platforms,
}: ContentPlatformOperationsProps) {
  return (
    <section
      className="content-page-section mx-auto max-w-[1600px] px-6 py-20 md:px-10 md:py-28"
      data-testid="content-platform-operations"
      id="content-platform-operations"
    >
      <header className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[rgb(var(--brand-accent))]">
            All-platform operation
          </p>
          <h2 className="mt-3 text-4xl font-medium leading-[1.02] tracking-[-0.055em] text-white md:text-6xl">
            一套内容策略，
            <br />
            进入每一个适合的场域。
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-7 text-[rgb(var(--brand-muted))] lg:justify-self-end">
          不是把同一份内容机械复制到所有平台，而是保持统一的内容核心，再依据平台语境调整表达形态、发布节奏与互动方式。
        </p>
      </header>
      <div className="content-platform-operation-model mt-10 overflow-hidden rounded-[24px]">
        <div className="content-platform-field relative grid gap-3 p-5 md:grid-cols-2 md:p-8 lg:min-h-[32rem] lg:grid-cols-3 lg:content-between">
          <div className="content-platform-core hidden lg:grid">
            <strong>统一内容策略</strong>
            <span>ONE CORE · MANY FORMS</span>
          </div>
          {platforms.map(({ focus, platform }, index) => (
            <article
              className="content-platform-context rounded-[16px] p-5"
              data-platform-index={index + 1}
              data-testid="content-platform"
              key={platform}
            >
              <h3 className="text-base font-medium text-white">{platformLabels[platform]}</h3>
              <p className="mt-2 text-xs leading-6 text-[rgb(var(--brand-muted))]">{focus}</p>
            </article>
          ))}
        </div>
        <div className="border-t border-white/10 p-5 md:p-8">
          <h3 className="text-2xl font-medium tracking-[-0.04em] text-white">
            全平台运营，不只是“发出去”
          </h3>
          <div className="content-operation-capability-grid mt-6 grid md:grid-cols-5">
            {capabilities.map((capability) => (
              <article
                className="content-operation-capability min-h-44 p-5"
                data-testid="content-operation-capability"
                key={capability.title}
              >
                <p className="text-[9px] tracking-[0.16em] text-[rgb(var(--brand-accent))]">
                  {capability.label}
                </p>
                <h4 className="mt-9 text-base font-medium text-white">{capability.title}</h4>
                <p className="mt-2 text-xs leading-6 text-[rgb(var(--brand-muted))]">
                  {capability.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Implement `ContentMethod`**

```tsx
import type { ContentMethodStep } from '@/pages/content/data'

interface ContentMethodProps {
  readonly steps: readonly ContentMethodStep[]
}

export default function ContentMethod({ steps }: ContentMethodProps) {
  return (
    <section
      className="content-page-section mx-auto max-w-[1600px] px-6 py-20 md:px-10 md:py-28"
      data-testid="content-method"
      id="content-method"
    >
      <header className="max-w-3xl">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[rgb(var(--brand-accent))]">
          How content continues
        </p>
        <h2 className="mt-3 text-4xl font-medium leading-[1.02] tracking-[-0.055em] text-white md:text-6xl">
          让内容持续发生，
          <br />
          也持续被理解。
        </h2>
      </header>
      <ol className="content-method-path mt-14 grid md:grid-cols-3 lg:grid-cols-6">
        {steps.map((step) => (
          <li
            className="content-method-step relative min-h-36 pt-7 md:pr-5"
            data-testid="content-method-step"
            key={step.title}
          >
            <span
              aria-hidden="true"
              className="content-method-node absolute left-0 top-[-4px] h-2 w-2 rounded-full"
            />
            <h3 className="text-lg font-medium text-white">{step.title}</h3>
            <p className="mt-3 text-xs leading-6 text-[rgb(var(--brand-muted))]">
              {step.description}
            </p>
          </li>
        ))}
      </ol>
    </section>
  )
}
```

- [ ] **Step 5: Implement `ContentValue`**

```tsx
interface ContentValueProps {
  readonly values: readonly string[]
}

export default function ContentValue({ values }: ContentValueProps) {
  return (
    <section
      className="content-page-section content-value-section mx-auto max-w-[1600px] px-6 py-24 text-center md:px-10 md:py-36"
      data-testid="content-value"
      id="content-value"
    >
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-[rgb(var(--brand-accent))]">
        What remains
      </p>
      <h2 className="mx-auto mt-3 max-w-4xl text-4xl font-medium leading-[1.02] tracking-[-0.055em] text-white md:text-6xl">
        内容最终留下的，
        <br />
        不只是曝光。
      </h2>
      <ul className="mx-auto mt-12 flex max-w-4xl flex-col justify-center gap-4 text-sm text-[rgb(var(--brand-muted))] md:flex-row md:gap-8">
        {values.map((value) => (
          <li key={value}>{value}</li>
        ))}
      </ul>
      <p className="mt-20 text-sm tracking-[0.08em] text-[rgb(var(--brand-accent))]">
        让一次被看见，成为持续发生的关系。
      </p>
    </section>
  )
}
```

- [ ] **Step 6: Run the component contract**

```bash
pnpm --filter @gaoge/app-brand test -- src/pages/content/components/ContentSections.test.tsx
```

Expected: PASS with six platforms, five operation capabilities, six method steps, and the closing value statement.

- [ ] **Step 7: Commit the operating model and conclusion**

```bash
git add apps/brand/src/pages/content/components/ContentPlatformOperations.tsx apps/brand/src/pages/content/components/ContentMethod.tsx apps/brand/src/pages/content/components/ContentValue.tsx apps/brand/src/pages/content/components/ContentSections.test.tsx
git commit -m "feat(brand): add all-platform content operations"
```

---

### Task 5: Compose the page, extend navigation, and remove matrix semantics

**Files:**

- Modify: `apps/brand/src/pages/content/ContentPage.tsx`
- Modify: `apps/brand/src/pages/content/components/ContentSectionNavigation.tsx`
- Modify: `apps/brand/src/App.test.tsx`
- Delete: `apps/brand/src/pages/content/components/CurrentContent.tsx`
- Delete: `apps/brand/src/pages/content/components/ContentPlatforms.tsx`
- Delete: `apps/brand/src/pages/content/components/ContentOperatingLoop.tsx`
- Delete: `apps/brand/src/pages/content/components/ContentPropertyBlock.tsx`
- Delete: `apps/brand/src/pages/content/components/PlatformRail.tsx`

**Interfaces:**

- Consumes: all data arrays from Task 1 and all section components from Tasks 2–4.
- Produces: a complete `/content` route with eight stable IDs, metadata title `高歌内容 - 内容创作与全平台运营`, and description `高歌以内容策略、创作、现场表达与全平台运营，连接品牌、平台和真实社群。`.

- [ ] **Step 1: Replace the App route contract**

Rename the describe block to `content capability route` and replace the old content test assertions with:

```tsx
expect(await screen.findByRole('heading', { name: 'GAOGE CONTENT' })).toBeInTheDocument()
expect(screen.getByRole('heading', { name: '让每一份热爱持续被看见。' })).toBeInTheDocument()
expect(
  screen.getByRole('heading', { name: '内容不是一次传播，而是持续建立关系。' }),
).toBeInTheDocument()
expect(screen.getByRole('heading', { name: '从内容发生，到关系留下。' })).toBeInTheDocument()
expect(screen.getByRole('heading', { name: '能力来自持续实践。' })).toBeInTheDocument()
expect(screen.getByRole('heading', { name: '让不同的故事，找到适合的表达。' })).toBeInTheDocument()
expect(
  screen.getByRole('heading', { name: '一套内容策略，进入每一个适合的场域。' }),
).toBeInTheDocument()
expect(screen.getByRole('heading', { name: '让内容持续发生，也持续被理解。' })).toBeInTheDocument()
expect(screen.getByRole('heading', { name: '内容最终留下的，不只是曝光。' })).toBeInTheDocument()
expect(container.querySelector('video')).not.toBeInTheDocument()
expect(container.querySelectorAll('[data-status]')).toHaveLength(0)
expect(screen.queryByRole('link', { name: /高歌体育/ })).not.toBeInTheDocument()
expect(screen.getByRole('link', { name: '进入高歌数字' })).toHaveAttribute('href', '/digital')
expect(document.title).toBe('高歌内容 - 内容创作与全平台运营')
```

Replace the four old navigation destinations with:

```ts
const sectionDestinations = [
  ['主张', '主张', '#content-overview'],
  ['内容理念', '理念', '#content-belief'],
  ['核心能力', '能力', '#content-capabilities'],
  ['真实实践', '实践', '#content-practice'],
  ['内容形态', '形态', '#content-formats'],
  ['全平台运营', '运营', '#content-platform-operations'],
  ['工作方法', '方法', '#content-method'],
  ['长期价值', '价值', '#content-value'],
] as const
```

Update the cross-page metadata assertion from `高歌内容 - 内容运营矩阵` to `高歌内容 - 内容创作与全平台运营`.

- [ ] **Step 2: Run the App route test and verify the old composition fails**

```bash
pnpm --filter @gaoge/app-brand test -- src/App.test.tsx
```

Expected: FAIL on the new headings, navigation destinations, absence of statuses/link, and new title.

- [ ] **Step 3: Extend the content section navigation**

Replace `contentSections` with the exact eight-item map:

```ts
const contentSections = [
  { id: 'content-overview', label: '主张', mobileLabel: '主张' },
  { id: 'content-belief', label: '内容理念', mobileLabel: '理念' },
  { id: 'content-capabilities', label: '核心能力', mobileLabel: '能力' },
  { id: 'content-practice', label: '真实实践', mobileLabel: '实践' },
  { id: 'content-formats', label: '内容形态', mobileLabel: '形态' },
  { id: 'content-platform-operations', label: '全平台运营', mobileLabel: '运营' },
  { id: 'content-method', label: '工作方法', mobileLabel: '方法' },
  { id: 'content-value', label: '长期价值', mobileLabel: '价值' },
] as const
```

Keep the existing `IntersectionObserver`, `scrollIntoView`, reduced-motion behavior, `aria-current="location"`, and `layoutId` indicator unchanged.

- [ ] **Step 4: Compose all eight sections and update metadata**

Replace `ContentPage.tsx` imports and body with:

```tsx
import BrandPageShell from '@/brand/components/BrandPageShell'
import { useBrandMetadata } from '@/brand/metadata'
import ContentBelief from '@/pages/content/components/ContentBelief'
import ContentCapabilities from '@/pages/content/components/ContentCapabilities'
import ContentFormats from '@/pages/content/components/ContentFormats'
import ContentHero from '@/pages/content/components/ContentHero'
import ContentMethod from '@/pages/content/components/ContentMethod'
import ContentPlatformOperations from '@/pages/content/components/ContentPlatformOperations'
import ContentPractice from '@/pages/content/components/ContentPractice'
import ContentSectionReveal from '@/pages/content/components/ContentSectionReveal'
import ContentValue from '@/pages/content/components/ContentValue'
import {
  contentBeliefs,
  contentCoreCapabilities,
  contentFormats,
  contentMethodSteps,
  contentOperationCapabilities,
  contentPlatformOperations,
  contentPractices,
  contentValues,
} from '@/pages/content/data'

export default function ContentPage() {
  useBrandMetadata({
    description: '高歌以内容策略、创作、现场表达与全平台运营，连接品牌、平台和真实社群。',
    title: '高歌内容 - 内容创作与全平台运营',
  })

  return (
    <BrandPageShell current="content" crossLink={{ label: '进入高歌数字', to: '/digital' }}>
      <ContentHero />
      <ContentSectionReveal>
        <ContentBelief beliefs={contentBeliefs} />
      </ContentSectionReveal>
      <ContentSectionReveal>
        <ContentCapabilities capabilities={contentCoreCapabilities} />
      </ContentSectionReveal>
      <ContentSectionReveal>
        <ContentPractice practices={contentPractices} />
      </ContentSectionReveal>
      <ContentSectionReveal>
        <ContentFormats formats={contentFormats} />
      </ContentSectionReveal>
      <ContentSectionReveal>
        <ContentPlatformOperations
          capabilities={contentOperationCapabilities}
          platforms={contentPlatformOperations}
        />
      </ContentSectionReveal>
      <ContentSectionReveal>
        <ContentMethod steps={contentMethodSteps} />
      </ContentSectionReveal>
      <ContentSectionReveal>
        <ContentValue values={contentValues} />
      </ContentSectionReveal>
    </BrandPageShell>
  )
}
```

- [ ] **Step 5: Remove legacy data exports and obsolete matrix components**

Run:

```bash
rg -n "CurrentContent|ContentPlatforms|ContentOperatingLoop|ContentPropertyBlock|PlatformRail|ContentProperty" apps/brand/src
```

Expected before deletion: matches only within `data.ts` and the five obsolete component files. Remove `ContentProperty`, `contentProperties`, and the old string-valued `contentCapabilities` from `data.ts`, then delete exactly those five files listed in this task. Do not delete shared `MatrixStatus` because `/digital` still consumes it.

- [ ] **Step 6: Run content contracts and typecheck**

```bash
pnpm --filter @gaoge/app-brand test -- src/pages/content/data.test.ts src/pages/content/components/ContentSections.test.tsx src/pages/content/components/ContentSectionReveal.test.tsx src/App.test.tsx
pnpm --filter @gaoge/app-brand typecheck
```

Expected: all tests and typecheck PASS. The route contains no status-bearing content and no body link for 高歌体育.

- [ ] **Step 7: Commit composition and semantic cleanup**

```bash
git add apps/brand/src/pages/content apps/brand/src/App.test.tsx
git commit -m "feat(brand): compose content capability showcase"
```

---

### Task 6: Replace matrix styling with the capability-showcase visual system

**Files:**

- Modify: `apps/brand/src/styles.css`
- Review: all files under `apps/brand/src/pages/content/`

**Interfaces:**

- Consumes: content-scoped class names defined in Tasks 2–5.
- Produces: a warm-red responsive showcase with editorial practice and format layouts, desktop platform relationships, mobile platform lists, reduced-motion support, and no page-level overflow.

- [ ] **Step 1: Remove selectors that only served the deleted matrix components**

Remove these selector blocks from `styles.css` after confirming no JSX references remain:

```text
.content-current-primary
.content-current-secondary
.content-platform-surface
.content-platform-cell
.content-operating-model
.content-loop-step
.content-loop-node
```

Keep `.brand-matrix-page[data-brand-area='content']`, `.content-page-section`, `.content-hero-visual`, `.content-section-navigation`, and `.content-section-navigation-track`.

- [ ] **Step 2: Add the content showcase surfaces**

Add content-scoped definitions near the existing content theme:

```css
.content-belief-list,
.content-capability-grid,
.content-platform-operation-model {
  background: rgb(var(--brand-surface) / 78%);
  border: 1px solid rgb(255 241 239 / 12%);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 6%);
}

.content-belief-item + .content-belief-item,
.content-capability-item,
.content-operation-capability {
  border-color: rgb(255 241 239 / 10%);
}

.content-belief-item + .content-belief-item {
  border-top: 1px solid rgb(255 241 239 / 10%);
}

.content-capability-item {
  background: linear-gradient(145deg, rgb(255 255 255 / 3%), transparent 62%);
  border-bottom: 1px solid rgb(255 241 239 / 10%);
}

.content-practice-item,
.content-format-item {
  background: rgb(22 14 14);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 7%);
}

.content-practice-item > .remote-image-fallback,
.content-format-item > .remote-image-fallback {
  position: absolute;
  inset: 0;
}

.content-format-shade {
  background:
    linear-gradient(0deg, rgb(10 5 5 / 86%), transparent 72%),
    radial-gradient(circle at 84% 10%, rgb(var(--brand-accent) / 20%), transparent 55%);
}

.content-platform-operation-model {
  background:
    radial-gradient(circle at 50% 38%, rgb(var(--brand-accent) / 12%), transparent 28rem),
    rgb(var(--brand-surface) / 82%);
}

.content-platform-context,
.content-operation-capability {
  background: rgb(255 255 255 / 3%);
  border: 1px solid rgb(255 241 239 / 10%);
}

.content-method-step {
  border-top: 1px solid rgb(255 241 239 / 14%);
}

.content-method-node {
  background: rgb(var(--brand-accent));
  box-shadow: 0 0 14px rgb(var(--brand-accent) / 44%);
}

.content-value-section {
  background: radial-gradient(circle at 50% 55%, rgb(var(--brand-accent) / 10%), transparent 28rem);
}
```

- [ ] **Step 3: Add asymmetric grid rules without changing DOM order**

```css
@media (width >= 768px) {
  .content-capability-item:nth-child(odd) {
    border-right: 1px solid rgb(255 241 239 / 10%);
  }

  .content-capability-item:nth-last-child(-n + 2) {
    border-bottom: 0;
  }

  .content-format-item:nth-child(1),
  .content-format-item:nth-child(6) {
    grid-row: span 2;
    min-height: 27rem;
  }

  .content-format-item:nth-child(3) {
    grid-column: span 2;
  }
}

@media (width >= 1024px) {
  .content-practice-item:first-child {
    grid-column: 1;
    grid-row: 1 / span 2;
  }

  .content-practice-item:not(:first-child) {
    grid-column: 2;
  }

  .content-platform-core {
    position: absolute;
    left: 50%;
    top: 50%;
    z-index: 1;
    height: 12rem;
    width: 12rem;
    translate: -50% -50%;
    place-items: center;
    border: 1px solid rgb(var(--brand-accent) / 45%);
    border-radius: 999px;
    background: rgb(58 21 18 / 76%);
    text-align: center;
  }

  .content-platform-core span {
    display: block;
    margin-top: 0.5rem;
    color: rgb(255 255 255 / 42%);
    font-size: 0.625rem;
    letter-spacing: 0.14em;
  }
}
```

Do not add SVG connector lines unless the relationship remains clear at 1024px and 1440px without crossing text. The central core plus spatial arrangement is sufficient and safer.

- [ ] **Step 4: Add mobile and preference fallbacks**

Inside `@media (width < 768px)`, keep the existing navigation edge mask and add:

```css
.content-platform-field {
  display: grid;
}

.content-operation-capability-grid {
  grid-template-columns: 1fr;
}

.content-operation-capability + .content-operation-capability {
  border-top: 1px solid rgb(255 241 239 / 10%);
}

.content-method-path {
  grid-template-columns: 1fr;
}
```

Under `prefers-reduced-motion: reduce`, ensure `.content-section-reveal`, `.content-hero-visual`, and media transforms resolve to visible non-translated states. Under the existing reduced-transparency and increased-contrast blocks, include the new showcase surfaces so backgrounds become more opaque and borders/text gain contrast.

- [ ] **Step 5: Run format and static verification**

```bash
pnpm exec prettier --check "apps/brand/src/**/*.{ts,tsx,css}"
pnpm exec eslint apps/brand/src
pnpm exec stylelint "apps/brand/src/**/*.css"
pnpm --filter @gaoge/app-brand typecheck
pnpm --filter @gaoge/app-brand test
pnpm --filter @gaoge/app-brand build
```

Expected: all commands PASS. If formatting fails, run the repository formatter on only the changed Brand files, inspect the diff, and rerun the checks.

- [ ] **Step 6: Run browser verification at the required viewports**

Start:

```bash
pnpm dev:brand
```

Open `/content` and verify:

- `1440×900`: hero is complete; all eight sections read in order; practice blocks look like evidence, not clickable products; platform operation has one clear center and six contexts.
- `1024×768`: eight-item section navigation remains usable; all-platform content does not collide or overlap.
- `390×844`: navigation is single-line horizontally scrollable; platform operation is a list; content wall and method remain readable.
- `320×800`: `document.documentElement.scrollWidth === document.documentElement.clientWidth`; headings, platform names, and capability names are not clipped.
- Keyboard: focus reaches the brand home link, eight section links, and footer links in order; body practices and platforms add no focus stops.
- Reduced motion: reveal and navigation remain usable with no translated hidden content.
- Console: no React key warnings, asset failures, observer errors, or hydration/runtime errors.

- [ ] **Step 7: Confirm changed-file scope and commit the visual system**

```bash
git status --short
git diff --stat
git add apps/brand/src/styles.css
git commit -m "style(brand): polish content capability showcase"
```

Expected: only the Content implementation, its tests, and `styles.css` changed across this plan; no `/digital`, `/group`, home, Sports, API, or shared-package source was modified.

---

### Task 7: Final scope and regression verification

**Files:**

- Verify only; do not modify files unless a failing check identifies a scoped defect.

**Interfaces:**

- Consumes: the complete `/content` route.
- Produces: fresh evidence that the approved design is implemented without regressions.

- [ ] **Step 1: Verify the final route contract and source semantics**

```bash
rg -n "https://sports\.gaoge\.cc|data-status|MatrixStatus|Current Content|平台矩阵|运营闭环" apps/brand/src/pages/content apps/brand/src/App.test.tsx
```

Expected: no old product-link, status, or matrix-language matches in the Content page. A footer or non-Content test match outside the scoped paths is not part of this check.

- [ ] **Step 2: Run the complete Brand verification suite from a clean process**

```bash
pnpm --filter @gaoge/app-brand test
pnpm --filter @gaoge/app-brand typecheck
pnpm --filter @gaoge/app-brand build
pnpm exec eslint apps/brand/src
pnpm exec stylelint "apps/brand/src/**/*.css"
pnpm exec prettier --check "apps/brand/src/**/*.{ts,tsx,css}"
```

Expected: all commands PASS with fresh output.

- [ ] **Step 3: Inspect repository state and commit only if verification required a fix**

```bash
git status --short
git diff --check
```

Expected: clean worktree after the Task 6 commit. If a scoped verification fix was required, rerun the failed check plus the complete suite, then commit only that fix with a conventional commit message describing the defect.

- [ ] **Step 4: Prepare the completion handoff**

Report:

- the eight-section capability narrative now live at `/content`;
- the removal of body product/status/link semantics;
- the six platforms and five all-platform operation capabilities;
- automated commands and browser viewports verified;
- any pre-existing unrelated warnings or unverified environment-specific preference modes.
