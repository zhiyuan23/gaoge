# 高歌 Content 抽象内容场 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `/content` 从八段能力手册收敛为四幕“抽象内容场”，只展示品牌主张、内容理念、四项核心能力和一句结尾收束。

**Architecture:** 保留现有 `BrandPageShell`、Content 路由、品牌导航和统一 reveal 基础能力。数据层只保留四项能力，页面组件收敛为 `ContentHero`、`ContentBelief`、`ContentCapabilities`、`ContentValue`，并删除无引用的案例、形态、平台矩阵和方法组件。视觉继续由现有 Tailwind、全局 CSS 和 Framer Motion 实现，不增加依赖。

**Tech Stack:** React 19、TypeScript、Vite、Tailwind CSS、Framer Motion、Vitest、Testing Library、ESLint、Stylelint、Prettier

## Global Constraints

- 首屏必须保留 `GAOGE CONTENT`、`让每一份热爱持续被看见。`、`以内容与运营连接品牌、平台和真实社群。`。
- 正文只有四幕，章节导航只有“主张、内容理念、核心能力”三项。
- 可见能力只包含“内容策略、内容创作、全平台运营、社群连接”。
- 全平台运营不展开具体平台、账号、发布节奏或数据。
- 全页只使用 `/assets/brand/content-league-atmosphere.jpg` 一处真实影像。
- 不展示案例、内容形态、平台清单、完整工作流程或价值清单。
- 不增加正文链接、CTA、状态标签、平台标签、运营数据或新依赖。
- 不使用四张等宽能力卡片；桌面端采用非对称能力场，移动端收敛为自然单列。
- 保持现有深酒红黑主题、暖白正文和品牌红强调色，不引入第二强调色。
- 动效只使用 `transform` 和 `opacity`，并完整支持 `prefers-reduced-motion`。
- 不修改 `/content` 路由、主导航标签、页脚链接、其他品牌页面或其他应用。

---

### Task 1: 收敛 Content 数据契约

**Files:**

- Modify: `apps/brand/src/pages/content/data.ts`
- Modify: `apps/brand/src/pages/content/data.test.ts`

**Interfaces:**

- Produces: `ContentCapability { readonly description: string; readonly title: string }`
- Produces: `contentCapabilities: readonly ContentCapability[]`
- Removes: `ContentVisual`、`ContentBelief`、`ContentPracticeItem`、`ContentFormat`、`ContentPlatformOperation`、`ContentOperationCapability`、`ContentMethodStep` 及其数据导出

- [ ] **Step 1: 将数据测试改为四项能力的唯一契约**

```ts
import { describe, expect, it } from 'vitest'

import { contentCapabilities } from '@/pages/content/data'

describe('content abstract field data', () => {
  it('defines only the four approved content capabilities', () => {
    expect(contentCapabilities).toEqual([
      { description: '找到值得表达的核心', title: '内容策略' },
      { description: '让故事形成自己的语言', title: '内容创作' },
      { description: '让内容进入适合的场域', title: '全平台运营' },
      { description: '让触达沉淀为长期关系', title: '社群连接' },
    ])
  })
})
```

- [ ] **Step 2: 运行数据测试并确认旧导出导致失败**

Run: `pnpm --filter @gaoge/app-brand test -- src/pages/content/data.test.ts`

Expected: FAIL，因为 `contentCapabilities` 尚未导出。

- [ ] **Step 3: 将 `data.ts` 收敛为单一能力数组**

```ts
export interface ContentCapability {
  readonly description: string
  readonly title: string
}

export const contentCapabilities: readonly ContentCapability[] = [
  { description: '找到值得表达的核心', title: '内容策略' },
  { description: '让故事形成自己的语言', title: '内容创作' },
  { description: '让内容进入适合的场域', title: '全平台运营' },
  { description: '让触达沉淀为长期关系', title: '社群连接' },
]
```

- [ ] **Step 4: 运行数据测试**

Run: `pnpm --filter @gaoge/app-brand test -- src/pages/content/data.test.ts`

Expected: PASS，1 test passed。

- [ ] **Step 5: 提交数据契约**

```bash
git add apps/brand/src/pages/content/data.ts apps/brand/src/pages/content/data.test.ts
git commit -m "refactor(brand): simplify content capability data"
```

---

### Task 2: 将正文组件重构为理念、能力场和结尾

**Files:**

- Modify: `apps/brand/src/pages/content/components/ContentBelief.tsx`
- Modify: `apps/brand/src/pages/content/components/ContentCapabilities.tsx`
- Modify: `apps/brand/src/pages/content/components/ContentValue.tsx`
- Modify: `apps/brand/src/pages/content/components/ContentSections.test.tsx`

**Interfaces:**

- Consumes: `contentCapabilities: readonly ContentCapability[]`
- Produces: `ContentBelief()`，无 props，渲染理念宣言
- Produces: `ContentCapabilities({ capabilities })`，渲染四项非交互能力
- Produces: `ContentValue()`，无 props，渲染单句结尾

- [ ] **Step 1: 将组件测试改为四幕正文契约**

```tsx
describe('content abstract field sections', () => {
  it('presents one manifesto, four capabilities and one closing statement', () => {
    const { container } = render(
      <>
        <ContentBelief />
        <ContentCapabilities capabilities={contentCapabilities} />
        <ContentValue />
      </>,
    )

    expect(
      screen.getByRole('heading', {
        name: '内容不是一次传播。它让故事持续发生，让关系慢慢留下。',
      }),
    ).toBeInTheDocument()
    expect(screen.getAllByTestId('content-capability')).toHaveLength(4)
    contentCapabilities.forEach(({ description, title }) => {
      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument()
      expect(screen.getByText(description)).toBeInTheDocument()
    })
    expect(
      screen.getByRole('heading', { name: '让一次被看见，成为持续发生的关系。' }),
    ).toBeInTheDocument()
    expect(container.querySelector('a')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 运行组件测试并确认旧结构不符合新契约**

Run: `pnpm --filter @gaoge/app-brand test -- src/pages/content/components/ContentSections.test.tsx`

Expected: FAIL，因为旧组件仍需要 `beliefs`、`values`，能力数据类型也不一致。

- [ ] **Step 3: 将 `ContentBelief` 改为三行静态宣言**

```tsx
export default function ContentBelief() {
  return (
    <section
      className="content-page-section content-belief-manifesto mx-auto flex min-h-[82dvh] max-w-[1600px] items-center px-6 py-24 md:px-10"
      data-testid="content-belief"
      id="content-belief"
    >
      <h2
        aria-label="内容不是一次传播。它让故事持续发生，让关系慢慢留下。"
        className="max-w-6xl text-5xl font-medium leading-[1.02] tracking-[-0.065em] text-white md:text-7xl lg:text-8xl"
      >
        <span>内容不是一次传播。</span>
        <span>它让故事持续发生，</span>
        <span>让关系慢慢留下。</span>
      </h2>
    </section>
  )
}
```

- [ ] **Step 4: 将 `ContentCapabilities` 改为非对称能力场语义结构**

```tsx
interface ContentCapabilitiesProps {
  readonly capabilities: readonly ContentCapability[]
}

export default function ContentCapabilities({ capabilities }: ContentCapabilitiesProps) {
  return (
    <section
      className="content-page-section content-capability-field mx-auto min-h-[100dvh] max-w-[1600px] px-6 py-24 md:px-10"
      data-testid="content-capabilities"
      id="content-capabilities"
    >
      <div aria-hidden="true" className="content-capability-core">
        内容
      </div>
      <div className="content-capability-items">
        {capabilities.map((capability, index) => (
          <article
            className="content-capability-item"
            data-capability-index={index + 1}
            data-testid="content-capability"
            key={capability.title}
          >
            <h2>{capability.title}</h2>
            <p>{capability.description}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 5: 将 `ContentValue` 改为单句结尾**

```tsx
export default function ContentValue() {
  return (
    <section
      className="content-page-section content-closing mx-auto flex min-h-[72dvh] max-w-[1600px] items-center justify-center px-6 py-24 text-center md:px-10"
      data-testid="content-closing"
    >
      <h2
        aria-label="让一次被看见，成为持续发生的关系。"
        className="max-w-4xl text-5xl font-medium leading-[1.02] tracking-[-0.06em] text-white md:text-7xl"
      >
        让一次被看见，
        <br />
        成为持续发生的关系。
      </h2>
    </section>
  )
}
```

- [ ] **Step 6: 运行组件测试与类型检查**

Run: `pnpm --filter @gaoge/app-brand test -- src/pages/content/components/ContentSections.test.tsx && pnpm --filter @gaoge/app-brand typecheck`

Expected: PASS。

- [ ] **Step 7: 提交正文组件**

```bash
git add apps/brand/src/pages/content/components/ContentBelief.tsx apps/brand/src/pages/content/components/ContentCapabilities.tsx apps/brand/src/pages/content/components/ContentValue.tsx apps/brand/src/pages/content/components/ContentSections.test.tsx
git commit -m "feat(brand): build abstract content narrative"
```

---

### Task 3: 组装四幕页面并删除旧能力手册结构

**Files:**

- Modify: `apps/brand/src/pages/content/ContentPage.tsx`
- Modify: `apps/brand/src/pages/content/components/ContentHero.tsx`
- Modify: `apps/brand/src/pages/content/components/ContentSectionNavigation.tsx`
- Modify: `apps/brand/src/App.test.tsx`
- Delete: `apps/brand/src/pages/content/config.ts`
- Delete: `apps/brand/src/pages/content/components/ContentPractice.tsx`
- Delete: `apps/brand/src/pages/content/components/ContentFormats.tsx`
- Delete: `apps/brand/src/pages/content/components/ContentPlatformOperations.tsx`
- Delete: `apps/brand/src/pages/content/components/ContentMethod.tsx`

**Interfaces:**

- Consumes: `contentCapabilities`
- Produces: `/content` 四幕顺序 `ContentHero -> ContentBelief -> ContentCapabilities -> ContentValue`
- Produces: 三个锚点 `#content-overview`、`#content-belief`、`#content-capabilities`

- [ ] **Step 1: 将 Content 路由测试的正文与导航期望缩减为新结构**

删除旧理念、案例、形态、平台和方法的正向断言，改为：

```ts
expect(
  screen.getByRole('heading', {
    name: '内容不是一次传播。它让故事持续发生，让关系慢慢留下。',
  }),
).toBeInTheDocument()
;['内容策略', '内容创作', '全平台运营', '社群连接'].forEach((capability) => {
  expect(screen.getByRole('heading', { name: capability })).toBeInTheDocument()
})
expect(
  screen.getByRole('heading', { name: '让一次被看见，成为持续发生的关系。' }),
).toBeInTheDocument()
expect(screen.queryByText('真实实践')).not.toBeInTheDocument()
expect(screen.queryByText('内容形态')).not.toBeInTheDocument()
expect(screen.queryByText('工作方法')).not.toBeInTheDocument()
expect(container.querySelectorAll('main img')).toHaveLength(1)
expect(container.querySelector('main a')).not.toBeInTheDocument()
```

将 Content 导航断言改为：

```ts
const sectionDestinations = [
  ['主张', '主张', '#content-overview'],
  ['内容理念', '理念', '#content-belief'],
  ['核心能力', '能力', '#content-capabilities'],
] as const
```

- [ ] **Step 2: 运行 App 路由测试并确认旧八项导航导致失败**

Run: `pnpm --filter @gaoge/app-brand test -- src/App.test.tsx`

Expected: FAIL，Content 章节导航仍包含八项。

- [ ] **Step 3: 将 `ContentPage` 收敛为四幕**

```tsx
export default function ContentPage() {
  useBrandMetadata({
    description: '高歌以内容策略、创作、全平台运营与社群连接，让每一份热爱持续被看见。',
    title: '高歌内容 - 内容创作与全平台运营',
  })

  return (
    <BrandPageShell current="content" crossLink={{ label: '进入高歌数字', to: '/digital' }}>
      <ContentHero />
      <ContentSectionReveal>
        <ContentBelief />
      </ContentSectionReveal>
      <ContentSectionReveal>
        <ContentCapabilities capabilities={contentCapabilities} />
      </ContentSectionReveal>
      <ContentSectionReveal>
        <ContentValue />
      </ContentSectionReveal>
    </BrandPageShell>
  )
}
```

- [ ] **Step 4: 将首屏影像改为抽象内容源**

保留现有文案和 Framer Motion reduced-motion 分支，将 figure 内部收敛为一张图和纯装饰层：

```tsx
<motion.figure
  className="content-hero-source relative min-h-[24rem] overflow-hidden"
  {...visualMotion}
>
  <img
    alt="夜间球场灯光下的真实赛事现场"
    className="content-hero-source-image absolute inset-0 h-full w-full object-cover"
    decoding="async"
    loading="eager"
    height="1086"
    src="/assets/brand/content-league-atmosphere.jpg"
    width="1448"
  />
  <div aria-hidden="true" className="content-hero-source-shade absolute inset-0" />
</motion.figure>
```

- [ ] **Step 5: 将章节导航数组缩减为三项**

```ts
const contentSections = [
  { id: 'content-overview', label: '主张', mobileLabel: '主张' },
  { id: 'content-belief', label: '内容理念', mobileLabel: '理念' },
  { id: 'content-capabilities', label: '核心能力', mobileLabel: '能力' },
] as const
```

- [ ] **Step 6: 删除无引用组件和 `config.ts`**

删除列出的五个文件后运行：

Run: `rg -n "ContentPractice|ContentFormats|ContentPlatformOperations|ContentMethod|contentPractices|contentFormats|contentPlatformOperations|contentMethodSteps|contentValues|ContentPlatform" apps/brand/src/pages/content apps/brand/src/App.test.tsx`

Expected: 无输出。

- [ ] **Step 7: 运行路由测试、Content 测试和类型检查**

Run: `pnpm --filter @gaoge/app-brand test -- src/App.test.tsx src/pages/content && pnpm --filter @gaoge/app-brand typecheck`

Expected: PASS。

- [ ] **Step 8: 提交页面组装与旧结构删除**

```bash
git add apps/brand/src/pages/content apps/brand/src/App.test.tsx
git commit -m "refactor(brand): reduce content page to four acts"
```

---

### Task 4: 实现抽象内容场视觉与克制动效

**Files:**

- Modify: `apps/brand/src/pages/content/components/ContentBelief.tsx`
- Modify: `apps/brand/src/pages/content/components/ContentCapabilities.tsx`
- Modify: `apps/brand/src/pages/content/components/ContentHero.tsx`
- Modify: `apps/brand/src/styles.css`

**Interfaces:**

- Consumes: 任务 2 的三段语义组件和任务 3 的单一赛事影像
- Produces: `content-hero-source`、`content-belief-manifesto`、`content-capability-field`、`content-capability-items`、`content-capability-core`、`content-closing` 视觉系统
- Produces: reduced-motion 下无位移、无缩放的稳定构图

- [ ] **Step 1: 为理念三行文字增加有意义的顺序进入**

使用 `motion.span` 和 `useReducedMotion()`；每行只改变 `opacity` 和 `y`：

```tsx
const lineMotion = (index: number): MotionProps =>
  reducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 28 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { amount: 0.6, once: true },
        transition: { delay: index * 0.08, duration: 0.52, ease: [0.16, 1, 0.3, 1] },
      }
```

三行中的第二行使用 `content-belief-accent`，只调整颜色，不使用渐变文字。

- [ ] **Step 2: 为四项能力增加从分散到稳定位置的轻微聚合**

```tsx
const offsets = [
  { x: -18, y: -12 },
  { x: 18, y: -8 },
  { x: 16, y: 12 },
  { x: -14, y: 16 },
] as const

const itemMotion = (index: number): MotionProps =>
  reducedMotion
    ? {}
    : {
        initial: { opacity: 0, ...offsets[index] },
        whileInView: { opacity: 1, x: 0, y: 0 },
        viewport: { amount: 0.45, once: true },
        transition: { delay: index * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] },
      }
```

能力项继续使用 `article`，不得添加按钮、链接、hover 抬升或指针光标。

- [ ] **Step 3: 用全局 CSS 建立抽象视觉场**

删除所有旧 Content 专用选择器，至少包括：

```css
.content-belief-list,
.content-belief-item,
.content-capability-grid,
.content-practice-item,
.content-format-item,
.content-platform-operation-model,
.content-platform-context,
.content-operation-capability,
.content-method-step,
.content-method-node,
.content-value-section
```

新增结构基线：

```css
.content-hero-source {
  min-width: 0;
  background: rgb(22 14 14);
  isolation: isolate;
}

.content-hero-source-image {
  filter: saturate(0.72) contrast(1.06);
  transform: scale(1.035);
}

.content-hero-source-shade {
  background:
    radial-gradient(circle at 72% 28%, rgb(var(--brand-accent) / 24%), transparent 24%),
    linear-gradient(90deg, rgb(16 10 10 / 58%), transparent 48%),
    linear-gradient(0deg, rgb(16 10 10 / 46%), transparent 56%);
}

.content-belief-manifesto h2 > span {
  display: block;
}

.content-belief-accent {
  color: rgb(var(--brand-accent));
}

.content-capability-field {
  position: relative;
  display: grid;
  place-items: center;
  isolation: isolate;
}

.content-capability-items {
  display: grid;
  width: 100%;
  grid-template-areas:
    'strategy . creation'
    '. core .'
    'community . operation';
  grid-template-columns: minmax(0, 1fr) minmax(10rem, 0.7fr) minmax(0, 1fr);
  gap: 4rem 2rem;
}

.content-capability-core {
  position: absolute;
  z-index: -1;
  display: grid;
  width: 15rem;
  height: 15rem;
  place-items: center;
  color: rgb(255 255 255 / 28%);
  border: 1px solid rgb(var(--brand-accent) / 32%);
  border-radius: 50%;
  box-shadow: 0 0 8rem rgb(var(--brand-accent) / 12%);
}
```

为四个 `data-capability-index` 分配 `grid-area`，并通过 `max-width`、对齐和字号差异制造非对称层级，不增加卡片背景或四周边框。

- [ ] **Step 4: 明确移动端、对比度与减少动态回退**

```css
@media (width < 768px) {
  .content-capability-items {
    grid-template-areas: none;
    grid-template-columns: 1fr;
    gap: 3rem;
  }

  .content-capability-item {
    grid-area: auto !important;
    max-width: 20rem;
  }

  .content-capability-item:nth-child(even) {
    margin-left: auto;
    text-align: right;
  }

  .content-capability-core {
    width: 11rem;
    height: 11rem;
    opacity: 0.5;
  }
}

@media (prefers-reduced-motion: reduce) {
  .content-hero-source-image,
  .content-belief-manifesto span,
  .content-capability-item {
    opacity: 1 !important;
    transform: none !important;
    will-change: auto;
  }
}
```

同步更新 `prefers-reduced-transparency` 和 `prefers-contrast: more` 选择器，删除所有已删除组件类名，确保能力文字和核心边界在高对比模式下仍清晰。

- [ ] **Step 5: 运行格式、样式、Lint、类型与组件测试**

Run: `pnpm exec prettier --check "apps/brand/src/**/*.{ts,tsx,css}" && pnpm exec eslint apps/brand/src && pnpm exec stylelint "apps/brand/src/**/*.css" && pnpm --filter @gaoge/app-brand typecheck && pnpm --filter @gaoge/app-brand test -- src/pages/content`

Expected: 全部 PASS。

- [ ] **Step 6: 提交抽象视觉场**

```bash
git add apps/brand/src/pages/content apps/brand/src/styles.css
git commit -m "style(brand): create abstract content field"
```

---

### Task 5: 浏览器 QA 与完整回归

**Files:**

- Verify: `apps/brand/src/pages/content/**`
- Verify: `apps/brand/src/styles.css`
- Verify: `apps/brand/src/App.test.tsx`

**Interfaces:**

- Consumes: 完成后的 `/content`
- Produces: 无溢出、无旧内容、无控制台错误且可生产构建的最终页面

- [ ] **Step 1: 静态检查旧内容与旧组件残留**

Run:

```bash
rg -n "真实实践|人物故事|赛事记录|公众号|视频号|小红书|抖音|B 站|社群与私域|洞察|策划|发布|复盘|ContentPractice|ContentFormats|ContentPlatformOperations|ContentMethod" apps/brand/src/pages/content
```

Expected: 无输出。

- [ ] **Step 2: 运行 Brand 完整质量检查**

Run:

```bash
pnpm exec prettier --check "apps/brand/src/**/*.{ts,tsx,css}"
pnpm exec eslint apps/brand/src
pnpm exec stylelint "apps/brand/src/**/*.css"
pnpm --filter @gaoge/app-brand typecheck
pnpm --filter @gaoge/app-brand test
pnpm --filter @gaoge/app-brand build
```

Expected: 全部退出码为 0；Vitest 无失败；Vite 生产构建完成。

- [ ] **Step 3: 启动 Brand 并检查桌面视口**

Run: `pnpm dev:brand -- --host 127.0.0.1`

在 1440×900 和 1024×768 检查：

- 首屏三段指定文案完整可见。
- 正文按主张、理念、能力、结尾顺序出现。
- 章节导航只有三项且单行显示。
- 页面只出现一张真实影像。
- 四项能力呈非对称空间关系，不是四张等宽卡片。
- 页面正文无链接、按钮、状态或平台标签。
- `document.documentElement.scrollWidth === document.documentElement.clientWidth`。
- 控制台无 error 或 warning。

- [ ] **Step 4: 检查移动端与无障碍回退**

在 390×844 和 320×568 检查：

- 首屏标题不裁切、不出现页面级水平滚动。
- 能力按单列自然阅读，偶数项右对齐但不越界。
- 三项章节导航可完整访问。
- 正文语义顺序与视觉顺序一致。
- 模拟 `prefers-reduced-motion: reduce` 后，文字和能力均直接显示最终状态。
- 键盘焦点只落在品牌导航、三个章节链接和页脚链接上。

- [ ] **Step 5: 检查最终工作区**

Run: `git diff --check && git status --short`

Expected: 无未提交修改；如果浏览器 QA 产生修正，重新执行 Task 5 的完整质量检查并单独提交修正。
