# 高歌品牌产品矩阵页面实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `apps/brand` 内交付 `/digital` 与 `/content` 两个正式产品矩阵页，并把品牌首页的数字、内容和体育入口改为可访问的真实导航。

**Architecture:** 正式品牌页使用共享导航、页面外壳、状态显示、媒体兜底与页面元信息能力，Skiing 首页只接入共享导航和链接能力，其他 `/concepts/*` 页面保持私有。数字页与内容页分别维护静态 TypeScript 数据和自己的视觉组件，避免抽象为通用卡片系统。

**Tech Stack:** React 18、React Router 6、TypeScript、Tailwind CSS 3、Framer Motion 12、Lucide React、Vitest、Testing Library

## Global Constraints

- 以 `docs/superpowers/specs/2026-08-04-brand-product-matrix-pages-design.md` 为唯一产品与视觉规格。
- 正式路由固定为 `/digital` 和 `/content`，不得放进 `/concepts/*` 注册表。
- Brand 内部链接使用 React Router 当前标签页；外部链接使用 `_blank`、`rel="noopener noreferrer"`。
- 状态只允许 `live`、`building`、`planned`；规划中条目不得渲染为链接。
- 第一版只使用静态 TypeScript 数据，不引入 API、CMS、筛选、搜索、分页或新依赖。
- 不虚构客户数、用户数、粉丝数、播放量、增长数据、产品界面或产品公开地址。
- 视觉方向固定为同一母品牌骨架下的两种气质：数字页冷白、银灰、石墨；内容页暗色、暖红、真实影像。
- 设计参数固定为 `DESIGN_VARIANCE 7 / MOTION_INTENSITY 4 / VISUAL_DENSITY 5`。
- 页面保持单一暗色主题，不加入主题切换；不使用纯黑与纯白作为新增页面的主表面色。
- 交互使用同一圆角规则：导航与小型交互为全圆角，内容容器为 `rounded-[28px]`，媒体容器为 `rounded-[24px]`。
- 动效只允许 `transform` 与 `opacity`，必须支持 `prefers-reduced-motion`，不得监听 `window.scroll` 更新 React state。
- 不制作 div 拼出的假后台截图。Compass 有真实截图时使用真实截图，否则显示品牌化文字视觉面。
- 页面可见文案不得出现 `—` 或 `–`；提交前必须逐项复核所有可见文案和 `alt`。
- 保留当前工作区中用户尚未提交的 Brand 重命名与首页改动，不覆盖、不还原无关文件。

---

## 文件结构

本次创建或修改的文件及职责如下：

```text
apps/brand/src/
├── App.test.tsx                         # 路由、导航、页面内容、链接和元信息集成测试
├── App.tsx                              # 注册两个正式懒加载路由
├── styles.css                           # 正式品牌页主题变量、复杂背景和降级规则
├── brand/
│   ├── metadata.ts                      # 页面 title 与 description 生命周期
│   └── components/
│       ├── BrandNavigation.tsx          # 正式品牌导航和当前领域状态
│       ├── BrandPageShell.tsx           # 矩阵页页面骨架与交叉页尾
│       ├── MatrixStatus.tsx             # 状态类型和页面语境文案
│       ├── MediaWithFallback.test.tsx   # 媒体加载失败测试
│       └── MediaWithFallback.tsx        # 图片成功、缺失和失败兜底
├── concepts/skiing/
│   ├── SkiingPage.tsx                   # 接入共享元信息
│   ├── components/
│   │   ├── BrandSignal.tsx              # 支持站内和站外角标链接
│   │   ├── SkiingHero.tsx               # 为三个角标传入目标
│   │   └── SkiingNavbar.tsx             # 替换为共享 BrandNavigation
├── pages/
│   ├── digital/
│   │   ├── DigitalPage.tsx              # 数字页整体编排
│   │   ├── data.test.ts                 # 产品数据真实性与链接约束
│   │   ├── data.ts                      # 数字产品静态矩阵
│   │   └── components/
│   │       ├── DigitalDirectory.tsx      # 按类别呈现完整矩阵
│   │       └── FeaturedProduct.tsx       # 不对称重点产品单元
│   └── content/
│       ├── ContentPage.tsx              # 内容页整体编排
│       ├── config.ts                    # 暂定品牌名和平台标签
│       ├── data.test.ts                 # 内容对象状态与链接约束
│       ├── data.ts                      # 内容品牌、平台与能力
│       └── components/
│           ├── ContentPropertyBlock.tsx # 杂志式内容对象影像块
│           └── PlatformRail.tsx          # 平台标签轨道
└── public/assets/brand/
    ├── compass-overview.webp            # 可选，仅在能取得真实产品截图时加入
    └── gaoge-sports-share.jpg            # 从现有高歌体育公开资产复制
```

`compass-overview.webp` 是条件文件。只有执行阶段能从 `https://compass.gaoge.cc` 获取清晰、真实且适合公开陈列的界面截图时才加入；否则数据中不填写 `visual`，页面自动使用文字视觉面。

---

### Task 1: 建立正式品牌页共享基础

**Files:**

- Create: `apps/brand/src/brand/metadata.ts`
- Create: `apps/brand/src/brand/components/BrandNavigation.tsx`
- Create: `apps/brand/src/brand/components/BrandPageShell.tsx`
- Create: `apps/brand/src/brand/components/MatrixStatus.tsx`
- Create: `apps/brand/src/brand/components/MediaWithFallback.tsx`
- Create: `apps/brand/src/brand/components/MediaWithFallback.test.tsx`
- Modify: `apps/brand/src/styles.css`

**Interfaces:**

- Produces: `type BrandArea = 'home' | 'digital' | 'content'`
- Produces: `BrandNavigation({ current, overlay })`
- Produces: `BrandPageShell({ children, current, crossLink })`
- Produces: `type MatrixStatusValue = 'live' | 'building' | 'planned'`
- Produces: `MatrixStatus({ context, status })`
- Produces: `MediaWithFallback({ alt, className, fallbackLabel, src })`
- Produces: `useBrandMetadata({ description, title })`

- [ ] **Step 1: 为媒体兜底编写失败测试**

在 `MediaWithFallback.test.tsx` 写入：

```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import MediaWithFallback from '@/brand/components/MediaWithFallback'

describe('MediaWithFallback', () => {
  it('keeps the label visible when no image is configured', () => {
    render(<MediaWithFallback alt="高歌 Club 产品视觉" fallbackLabel="GAOGE CLUB" />)

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByText('GAOGE CLUB')).toBeInTheDocument()
  })

  it('replaces a failed image with the branded text fallback', () => {
    render(
      <MediaWithFallback
        alt="Gaoge Compass 产品界面"
        fallbackLabel="GAOGE COMPASS"
        src="/assets/brand/compass-overview.webp"
      />,
    )

    fireEvent.error(screen.getByRole('img', { name: 'Gaoge Compass 产品界面' }))

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByText('GAOGE COMPASS')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 运行测试并确认失败**

Run:

```bash
pnpm --filter @gaoge/app-brand test -- src/brand/components/MediaWithFallback.test.tsx
```

Expected: FAIL，原因是 `MediaWithFallback` 模块尚不存在。

- [ ] **Step 3: 实现状态、媒体兜底和元信息能力**

`MatrixStatus.tsx` 使用以下公开类型和映射：

```tsx
export type MatrixStatusValue = 'live' | 'building' | 'planned'

const labels = {
  content: {
    building: '建设中',
    live: '运营中',
    planned: '规划中',
  },
  digital: {
    building: '建设中',
    live: '运行中',
    planned: '规划中',
  },
} as const

interface MatrixStatusProps {
  readonly context: 'content' | 'digital'
  readonly status: MatrixStatusValue
}

export default function MatrixStatus({ context, status }: MatrixStatusProps) {
  return (
    <span
      className="border-current/25 inline-flex rounded-full border px-3 py-1 text-xs tracking-[0.08em]"
      data-status={status}
    >
      {labels[context][status]}
    </span>
  )
}
```

`MediaWithFallback.tsx` 使用本地 `useState` 保存单张图片失败状态，未提供 `src` 或触发 `onError` 时渲染同一个固定比例文字视觉面。外层必须保留 `overflow-hidden` 和最小高度，图片使用 `h-full w-full object-cover`，不得绘制假界面。

`metadata.ts` 导出：

```ts
interface BrandMetadata {
  readonly description: string
  readonly title: string
}

export function useBrandMetadata({ description, title }: BrandMetadata): void
```

hook 在 `useEffect` 内：

1. 保存进入页面前的 `document.title`。
2. 查找 `meta[name="description"]`，不存在则创建并记住由本 hook 创建。
3. 写入新标题和描述。
4. cleanup 时恢复原标题和原描述；若 meta 是本 hook 创建则移除。

- [ ] **Step 4: 实现共享导航和页面外壳**

`BrandNavigation.tsx` 使用固定配置：

```tsx
const brandAreas = [
  { label: '数字', to: '/digital' },
  { label: '内容', to: '/content' },
  { href: 'https://sports.gaoge.cc', label: '体育' },
  { label: '未来', title: '领域拓展中' },
] as const
```

行为要求：

- 标识使用 `<Link aria-label="高歌首页" to="/">`。
- 数字与内容使用 `<NavLink>`，命中当前页时包含 `aria-current="page"`。
- 体育使用安全的新标签页外链。
- 未来使用非交互 `<span aria-label="未来，领域拓展中">`。
- `current="home"` 时不高亮领域项，`current="digital"` 和 `current="content"` 与路由一致。
- `overlay` 只控制首页透明背景与矩阵页实体背景，不改变导航结构。
- 开发者入口继续使用低强调线条 `UserRound` 按钮和现有无效状态，不新增联系方式。
- 桌面导航保持单行且高度不超过 72px；移动端保留标识、当前领域短标签和个人按钮，完整领域列表可隐藏。

`BrandPageShell.tsx` 接受：

```tsx
interface BrandPageShellProps {
  readonly children: ReactNode
  readonly crossLink: {
    readonly label: string
    readonly to: '/content' | '/digital'
  }
  readonly current: 'content' | 'digital'
}
```

它渲染固定导航、`children` 和页尾两个站内链接：

- `返回高歌首页`
- `crossLink.label`

页尾链接全部使用 React Router `Link`，不得使用 `window.location`。

- [ ] **Step 5: 添加正式品牌页基础主题**

在 `styles.css` 中增加：

```css
.brand-matrix-page {
  min-width: 320px;
  color: #f1f3f5;
  background: #111315;
}

.brand-matrix-page[data-brand-area='digital'] {
  --brand-accent: 173 191 204;
  --brand-surface: 25 29 32;
  --brand-muted: 164 174 181;
}

.brand-matrix-page[data-brand-area='content'] {
  --brand-accent: 191 74 66;
  --brand-surface: 30 24 24;
  --brand-muted: 185 171 169;
}
```

复杂背景只能使用低对比度渐变、固定伪元素或现有真实媒体；不得添加紫色光晕、装饰网格线或纯黑表面。为 `.brand-matrix-page` 增加 reduced-motion 降级，关闭自动动画持续时间，但保留焦点与按压反馈。

- [ ] **Step 6: 运行共享层测试和类型检查**

Run:

```bash
pnpm --filter @gaoge/app-brand test -- src/brand/components/MediaWithFallback.test.tsx
pnpm --filter @gaoge/app-brand typecheck
```

Expected: 两条命令 PASS。

- [ ] **Step 7: 提交共享基础**

```bash
git add \
  apps/brand/src/brand \
  apps/brand/src/styles.css
git commit -m "feat(brand): add shared brand page foundation"
```

---

### Task 2: 接入正式路由和品牌首页入口

**Files:**

- Modify: `apps/brand/src/App.test.tsx`
- Modify: `apps/brand/src/App.tsx`
- Modify: `apps/brand/src/concepts/skiing/SkiingPage.tsx`
- Modify: `apps/brand/src/concepts/skiing/components/BrandSignal.tsx`
- Modify: `apps/brand/src/concepts/skiing/components/SkiingHero.tsx`
- Modify: `apps/brand/src/concepts/skiing/components/SkiingNavbar.tsx`

**Interfaces:**

- Consumes: `BrandNavigation({ current: 'home', overlay: true })`
- Consumes: `useBrandMetadata({ title, description })`
- Produces: `BrandSignal` with either `to` or external `href`
- Produces: lazy route entries for `/digital` and `/content`

- [ ] **Step 1: 更新首页和路由集成测试**

先在 `App.test.tsx` 把 Skiing 首页原有断言改为：

```tsx
const digitalLink = screen.getByRole('link', { name: '数字' })
const contentLink = screen.getByRole('link', { name: '内容' })
const sportsLink = screen.getByRole('link', { name: '体育' })

expect(digitalLink).toHaveAttribute('href', '/digital')
expect(contentLink).toHaveAttribute('href', '/content')
expect(digitalLink).not.toHaveAttribute('target')
expect(contentLink).not.toHaveAttribute('target')
expect(sportsLink).toHaveAttribute('href', 'https://sports.gaoge.cc')
expect(sportsLink).toHaveAttribute('target', '_blank')
expect(sportsLink).toHaveAttribute('rel', 'noopener noreferrer')
```

再加入角标断言：

```tsx
expect(screen.getByRole('link', { name: '进入数字产品' })).toHaveAttribute('href', '/digital')
expect(screen.getByRole('link', { name: '进入内容创造' })).toHaveAttribute('href', '/content')
expect(screen.getByRole('link', { name: '进入高歌体育' })).toHaveAttribute(
  'href',
  'https://sports.gaoge.cc',
)
```

加入正式路由 smoke test。页面组件尚未建立时可临时只断言最终 location，不能在实现中留下 mock：

```tsx
it.each([
  ['/digital', 'GAOGE DIGITAL'],
  ['/content', 'GAOGE CONTENT'],
])('keeps %s as a formal brand route', async (path, heading) => {
  renderRoute(path)

  expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument()
  expect(screen.getByTestId('location')).toHaveTextContent(path)
})
```

- [ ] **Step 2: 运行首页测试并确认失败**

Run:

```bash
pnpm --filter @gaoge/app-brand test -- src/App.test.tsx
```

Expected: FAIL，首页数字仍指向 Compass、内容不是链接、正式路由尚未注册。

- [ ] **Step 3: 让 BrandSignal 支持真实导航**

把 `BrandSignalProps` 改为判别联合：

```tsx
type BrandSignalDestination =
  | { readonly href: string; readonly to?: never }
  | { readonly href?: never; readonly to: string }

type BrandSignalProps = BrandSignalDestination & {
  readonly ariaLabel: string
  readonly className: string
  readonly dividerClassName: string
  readonly dividerPosition: 'before' | 'after'
  readonly label: string
  readonly value: string
}
```

共享同一个视觉内容节点：

- 有 `to` 时使用 React Router `Link`。
- 有 `href` 时使用 `<a target="_blank" rel="noopener noreferrer">`。
- 根链接保留现有绝对定位 class，并增加 `rounded-[24px]`、`focus-visible` 和 `active:scale-[0.98]`。
- 不添加背景按钮块，hover 只提升文字和分隔线对比度。

`SkiingHero.tsx` 传入：

```tsx
<BrandSignal ariaLabel="进入高歌体育" href="https://sports.gaoge.cc" ... />
<BrandSignal ariaLabel="进入数字产品" to="/digital" ... />
<BrandSignal ariaLabel="进入内容创造" to="/content" ... />
```

- [ ] **Step 4: 让 Skiing 首页接入共享导航和元信息**

`SkiingNavbar.tsx` 收敛为：

```tsx
import BrandNavigation from '@/brand/components/BrandNavigation'

export default function SkiingNavbar() {
  return <BrandNavigation current="home" overlay />
}
```

`SkiingPage.tsx` 删除直接写 `document.title` 的逻辑，改为：

```tsx
useBrandMetadata({
  description: '高歌以数字产品、内容运营与体育热爱，连接正在发生的未来。',
  title: '高歌 GAOGE - 享受你的热爱',
})
```

保留 `skiing-active` body class 的 effect 和 cleanup。

- [ ] **Step 5: 注册正式懒加载路由**

`App.tsx` 新增：

```tsx
const ContentPage = lazy(() => import('@/pages/content/ContentPage'))
const DigitalPage = lazy(() => import('@/pages/digital/DigitalPage'))
```

把现有 `ConceptRoute` 重命名为语义通用的 `LazyPageRoute`，然后在 `/concepts` 之前注册：

```tsx
<Route path="/digital" element={<LazyPageRoute component={DigitalPage} />} />
<Route path="/content" element={<LazyPageRoute component={ContentPage} />} />
```

懒加载占位文案由 `LOADING CONCEPT` 改为 `LOADING GAOGE`，未知路由继续重定向 `/`，现有 `/concepts/*` 行为不变。

为使本 Task 可编译，先创建最小的 `DigitalPage.tsx` 与 `ContentPage.tsx`：

```tsx
export default function DigitalPage() {
  return <h1>GAOGE DIGITAL</h1>
}
```

```tsx
export default function ContentPage() {
  return <h1>GAOGE CONTENT</h1>
}
```

Task 3 和 Task 4 会分别替换这两个最小页面，不能把它们作为最终交付。

- [ ] **Step 6: 运行路由测试和类型检查**

Run:

```bash
pnpm --filter @gaoge/app-brand test -- src/App.test.tsx
pnpm --filter @gaoge/app-brand typecheck
```

Expected: PASS，且现有 concept 索引、旧路径重定向、Creator 和 Coding 测试均不回归。

- [ ] **Step 7: 提交路由和首页入口**

```bash
git add \
  apps/brand/src/App.test.tsx \
  apps/brand/src/App.tsx \
  apps/brand/src/concepts/skiing \
  apps/brand/src/pages/content/ContentPage.tsx \
  apps/brand/src/pages/digital/DigitalPage.tsx
git commit -m "feat(brand): connect product matrix routes"
```

---

### Task 3: 实现高歌数字产品矩阵

**Files:**

- Create: `apps/brand/src/pages/digital/data.ts`
- Create: `apps/brand/src/pages/digital/data.test.ts`
- Create: `apps/brand/src/pages/digital/components/FeaturedProduct.tsx`
- Create: `apps/brand/src/pages/digital/components/DigitalDirectory.tsx`
- Modify: `apps/brand/src/pages/digital/DigitalPage.tsx`
- Modify: `apps/brand/src/App.test.tsx`
- Optional Create: `apps/brand/public/assets/brand/compass-overview.webp`

**Interfaces:**

- Produces: `type DigitalCategory = 'enterprise' | 'consumer' | 'platform'`
- Produces: `interface DigitalProduct`
- Produces: `featuredDigitalProducts`, `digitalDirectory`, `digitalCapabilities`
- Consumes: `BrandPageShell`, `MatrixStatus`, `MediaWithFallback`, `useBrandMetadata`

- [ ] **Step 1: 为数字产品数据编写约束测试**

`data.test.ts` 写入：

```ts
import { describe, expect, it } from 'vitest'

import { digitalProducts } from '@/pages/digital/data'

describe('digital product matrix', () => {
  it('keeps Compass as the only confirmed live external product', () => {
    const linkedProducts = digitalProducts.filter(({ href }) => href)

    expect(linkedProducts).toEqual([
      expect.objectContaining({
        href: 'https://compass.gaoge.cc',
        name: '高歌跨境 ERP',
        status: 'live',
      }),
    ])
  })

  it('does not give planned products a destination', () => {
    expect(digitalProducts.filter(({ status }) => status === 'planned')).not.toEqual([])
    digitalProducts
      .filter(({ status }) => status === 'planned')
      .forEach((product) => expect(product.href).toBeUndefined())
  })

  it('covers enterprise, consumer and platform categories', () => {
    expect(new Set(digitalProducts.map(({ category }) => category))).toEqual(
      new Set(['enterprise', 'consumer', 'platform']),
    )
  })
})
```

- [ ] **Step 2: 运行数据测试并确认失败**

Run:

```bash
pnpm --filter @gaoge/app-brand test -- src/pages/digital/data.test.ts
```

Expected: FAIL，原因是数字产品数据文件尚不存在。

- [ ] **Step 3: 建立数字产品静态数据**

`data.ts` 定义：

```ts
import type { MatrixStatusValue } from '@/brand/components/MatrixStatus'

export type DigitalCategory = 'enterprise' | 'consumer' | 'platform'

export interface DigitalProduct {
  readonly category: DigitalCategory
  readonly englishName?: string
  readonly featured: boolean
  readonly href?: string
  readonly name: string
  readonly status: MatrixStatusValue
  readonly summary: string
  readonly tags: readonly string[]
  readonly visual?: {
    readonly alt: string
    readonly src: string
  }
}
```

`digitalProducts` 必须使用以下名称、状态和链接：

| name           | englishName   | category   | status   | featured | href                       | summary                                  | tags                         |
| -------------- | ------------- | ---------- | -------- | -------- | -------------------------- | ---------------------------------------- | ---------------------------- |
| 高歌跨境 ERP   | Gaoge Compass | enterprise | live     | true     | `https://compass.gaoge.cc` | 跨境电商业务的订单、商品与经营协同系统。 | 企业软件、跨境电商、独立部署 |
| 高歌 Club      | Gaoge Club    | consumer   | building | true     | 无                         | 面向会员、活动与俱乐部关系的数字产品。   | 会员、活动、社群             |
| 高歌客户 CRM   | Gaoge CRM     | enterprise | building | true     | 无                         | 客户关系与跟进过程的统一记录工具。       | 客户、跟进、协作             |
| 高歌通用 ERP   | Gaoge ERP     | enterprise | planned  | false    | 无                         | 面向通用经营流程的独立企业管理产品。     | 经营、流程、独立产品         |
| 高歌内容 CMS   | Gaoge CMS     | enterprise | planned  | false    | 无                         | 支持内容资产、发布流程与多平台协作。     | 内容、发布、协作             |
| 高歌协同 OA    | Gaoge OA      | enterprise | planned  | false    | 无                         | 组织内部审批、任务与日常协同工具。       | 审批、任务、组织             |
| 高歌洞察 BI    | Gaoge BI      | enterprise | planned  | false    | 无                         | 汇集经营数据并形成可读分析视图。         | 数据、分析、经营             |
| 赛事与会员     | 无            | consumer   | planned  | false    | 无                         | 面向赛事参与者的报名、会员与活动服务。   | 赛事、报名、会员             |
| 票券与现场服务 | 无            | consumer   | planned  | false    | 无                         | 支持票券流转与现场服务衔接。             | 票券、现场、服务             |
| 身份与权限     | Gaoge IAM     | platform   | planned  | false    | 无                         | 统一身份、访问控制与产品间权限边界。     | 身份、权限、安全             |
| 工作流与数据   | 无            | platform   | planned  | false    | 无                         | 让业务流程和共享数据能力独立复用。       | 工作流、数据、复用           |
| AI 与连接器    | 无            | platform   | planned  | false    | 无                         | 提供受控的智能能力与外部系统连接。       | AI、连接器、集成             |
| 多端交付       | 无            | platform   | building | false    | 无                         | 支持 Web、桌面、移动与小程序交付。       | Web、桌面、移动              |

文案规则：

- `summary` 每条不超过 32 个中文字符，描述产品边界，不写领先、赋能、革命性、全栈等泛化词。
- `tags` 每项不超过 6 个汉字，每产品最多 3 项。
- Compass 的 `visual` 只在真实截图文件存在时设置为 `/assets/brand/compass-overview.webp`。
- `digitalCapabilities` 固定为：`独立产品`、`共享平台能力`、`独立部署与专属云`、`后续 SaaS`。

- [ ] **Step 4: 实现重点产品不对称布局**

`FeaturedProduct.tsx` 接受：

```tsx
interface FeaturedProductProps {
  readonly emphasis: 'primary' | 'secondary'
  readonly product: DigitalProduct
}
```

要求：

- 主产品占 `lg:col-span-7 lg:row-span-2`，两个次产品分别占 `lg:col-span-5`。
- 只有带 `href` 的产品整体渲染为安全外链；其他产品使用 `<article>`。
- 状态在文字区内呈现，不叠加到图片上。
- `MediaWithFallback` 的 `fallbackLabel` 使用 `englishName ?? name`。
- hover 只移动 `translateY(-2px)` 并调整边框，active 恢复，不使用外发光。
- 移动端明确降级为一列，Compass 不保留跨行。

- [ ] **Step 5: 实现分类目录**

`DigitalDirectory.tsx` 接受：

```tsx
interface DigitalDirectoryProps {
  readonly products: readonly DigitalProduct[]
}
```

按固定标签分为：

```ts
const categoryLabels = {
  consumer: '消费者与体育产品',
  enterprise: '企业软件',
  platform: '平台能力',
} as const
```

布局规则：

- 三类使用不同宽度的栏目组成 `lg:grid-cols-12`，不是三个等宽卡片。
- 企业软件占 5 列，消费者占 3 列，平台能力占 4 列。
- 类目内部按 2 列小块或紧凑条带排列，不能为每一项同时使用上下边框。
- 规划中条目使用普通 `<article>`，没有伪链接和 disabled 按钮。
- 空数组时显示 `数字产品矩阵正在整理中`。

- [ ] **Step 6: 编排 DigitalPage**

页面结构固定为五段：

1. 首屏：`GAOGE DIGITAL`、`让复杂业务有清晰系统。`、一句不超过 20 个中文字的说明、`查看重点产品` 锚点。
2. 重点产品：不对称 `1 + 2`。
3. 完整产品矩阵：三类目录。
4. 交付边界：四项能力采用一条横向文字带，移动端可自然换行，不做四张相同卡片。
5. `BrandPageShell` 页尾。

页面入口：

```tsx
useBrandMetadata({
  description: '高歌数字旗下企业软件、消费者应用与平台能力。',
  title: '高歌数字 - 数字产品矩阵',
})
```

首屏必须使用 `min-h-[100dvh]`，导航下方内容不超过初始视口；标题最多两行。可使用 Framer Motion 做一次性淡入和轻微位移，`useReducedMotion()` 为 true 时 `initial={false}`。

- [ ] **Step 7: 增加数字页集成测试**

在 `App.test.tsx` 加入：

```tsx
describe('digital matrix route', () => {
  it('renders the product matrix with truthful link behavior', async () => {
    renderRoute('/digital')

    expect(await screen.findByRole('heading', { name: 'GAOGE DIGITAL' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '让复杂业务有清晰系统。' })).toBeInTheDocument()
    expect(screen.getByText('高歌跨境 ERP')).toBeInTheDocument()
    expect(screen.getByText('高歌 Club')).toBeInTheDocument()
    expect(screen.getByText('高歌客户 CRM')).toBeInTheDocument()
    expect(screen.getByText('企业软件')).toBeInTheDocument()
    expect(screen.getByText('消费者与体育产品')).toBeInTheDocument()
    expect(screen.getByText('平台能力')).toBeInTheDocument()

    const compass = screen.getByRole('link', { name: /高歌跨境 ERP/ })
    expect(compass).toHaveAttribute('href', 'https://compass.gaoge.cc')
    expect(compass).toHaveAttribute('target', '_blank')
    expect(compass).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.queryByRole('link', { name: /高歌通用 ERP/ })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: '返回高歌首页' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: '进入高歌内容' })).toHaveAttribute('href', '/content')
    expect(screen.getByRole('link', { name: '数字' })).toHaveAttribute('aria-current', 'page')
    expect(document.title).toBe('高歌数字 - 数字产品矩阵')
  })
})
```

- [ ] **Step 8: 运行数字页校验**

Run:

```bash
pnpm --filter @gaoge/app-brand test -- src/pages/digital/data.test.ts src/App.test.tsx
pnpm --filter @gaoge/app-brand typecheck
```

Expected: PASS。

- [ ] **Step 9: 提交数字页**

```bash
git add \
  apps/brand/public/assets/brand \
  apps/brand/src/App.test.tsx \
  apps/brand/src/pages/digital
git commit -m "feat(brand): add digital product matrix"
```

若未取得真实 Compass 截图，`git add` 中省略不存在的 `apps/brand/public/assets/brand/compass-overview.webp`，不得为了满足路径而创建空文件。

---

### Task 4: 实现高歌内容运营矩阵

**Files:**

- Create: `apps/brand/src/pages/content/config.ts`
- Create: `apps/brand/src/pages/content/data.ts`
- Create: `apps/brand/src/pages/content/data.test.ts`
- Create: `apps/brand/src/pages/content/components/ContentPropertyBlock.tsx`
- Create: `apps/brand/src/pages/content/components/PlatformRail.tsx`
- Modify: `apps/brand/src/pages/content/ContentPage.tsx`
- Modify: `apps/brand/src/App.test.tsx`
- Create: `apps/brand/public/assets/brand/gaoge-sports-share.jpg`

**Interfaces:**

- Produces: `type ContentPlatform`
- Produces: `interface ContentProperty`
- Produces: `contentProperties`, `contentCapabilities`, `platformLabels`
- Consumes: `BrandPageShell`, `MatrixStatus`, `MediaWithFallback`, `useBrandMetadata`

- [ ] **Step 1: 为内容矩阵数据编写约束测试**

`data.test.ts` 写入：

```ts
import { describe, expect, it } from 'vitest'

import { contentProperties } from '@/pages/content/data'

describe('content operation matrix', () => {
  it('only publishes the confirmed sports destination', () => {
    expect(contentProperties.filter(({ href }) => href)).toEqual([
      expect.objectContaining({
        href: 'https://sports.gaoge.cc',
        name: '高歌体育',
        status: 'live',
      }),
    ])
  })

  it('does not invent links for the league or personal IP', () => {
    ;['高歌超级联赛', '主理人个人 IP'].forEach((name) => {
      expect(contentProperties.find((property) => property.name === name)?.href).toBeUndefined()
    })
  })

  it('uses only configured platform identifiers', () => {
    const platforms = contentProperties.flatMap(({ platforms }) => platforms)
    expect(platforms).toEqual(
      expect.arrayContaining([
        'wechat',
        'channels',
        'xiaohongshu',
        'douyin',
        'bilibili',
        'community',
      ]),
    )
  })
})
```

- [ ] **Step 2: 运行数据测试并确认失败**

Run:

```bash
pnpm --filter @gaoge/app-brand test -- src/pages/content/data.test.ts
```

Expected: FAIL，原因是内容矩阵数据文件尚不存在。

- [ ] **Step 3: 集中配置品牌名和平台名**

`config.ts` 写入：

```ts
export const contentBrandName = {
  english: 'GAOGE CONTENT',
  chinese: '高歌内容',
} as const

export type ContentPlatform =
  | 'wechat'
  | 'channels'
  | 'xiaohongshu'
  | 'douyin'
  | 'bilibili'
  | 'community'

export const platformLabels = {
  bilibili: 'B 站',
  channels: '视频号',
  community: '社群与私域',
  douyin: '抖音',
  wechat: '公众号',
  xiaohongshu: '小红书',
} as const satisfies Record<ContentPlatform, string>
```

后续调整“高歌内容”名称时只修改此文件，路由和组件不得硬编码第二份品牌名。

- [ ] **Step 4: 建立内容对象和能力数据**

`data.ts` 定义：

```ts
import type { MatrixStatusValue } from '@/brand/components/MatrixStatus'
import type { ContentPlatform } from '@/pages/content/config'

export interface ContentProperty {
  readonly href?: string
  readonly name: string
  readonly platforms: readonly ContentPlatform[]
  readonly status: MatrixStatusValue
  readonly summary: string
  readonly type: 'brand' | 'ip'
  readonly visual?: {
    readonly alt: string
    readonly src: string
  }
}
```

首版数据固定为：

| name          | type  | status   | href                      | platforms                                                  | summary                                |
| ------------- | ----- | -------- | ------------------------- | ---------------------------------------------------------- | -------------------------------------- |
| 高歌体育      | brand | live     | `https://sports.gaoge.cc` | wechat、channels、xiaohongshu、douyin、bilibili、community | 围绕体育热爱持续记录赛事、人物与现场。 |
| 高歌超级联赛  | brand | building | 无                        | channels、xiaohongshu、douyin、community                   | 面向自有赛事的内容表达与活动传播。     |
| 主理人个人 IP | ip    | building | 无                        | wechat、channels、xiaohongshu、douyin、bilibili            | 记录产品、内容与体育实践中的个人观察。 |

不填写任何平台账号地址。`contentCapabilities` 固定为：

```ts
export const contentCapabilities = [
  '内容策划',
  '图文与短视频生产',
  '多平台分发',
  '活动传播',
  '社群承接',
  '数据复盘',
] as const
```

把 `apps/sports/public/gaoge_logo_wechat_share.jpg` 复制到 `apps/brand/public/assets/brand/gaoge-sports-share.jpg`，作为已确认的高歌体育品牌资产。复制后不得让 Brand 运行时引用 `apps/sports` 路径。

- [ ] **Step 5: 实现杂志式内容对象**

`ContentPropertyBlock.tsx` 接受：

```tsx
interface ContentPropertyBlockProps {
  readonly property: ContentProperty
  readonly size: 'hero' | 'portrait' | 'wide'
}
```

要求：

- 高歌体育使用 `hero`，高歌超级联赛使用 `wide`，个人 IP 使用 `portrait`。
- 尺寸变化来自 CSS Grid 跨列和真实媒体比例，不使用三张等宽卡片。
- 图片或视频区域不叠加 pills；名称、状态、平台标签位于媒体外的文字区。
- 只有高歌体育渲染为安全新标签页链接，另外两项为 `<article>`。
- `MediaWithFallback` 在没有图片时显示名称和暖红表面。
- 移动端全部按内容顺序变为单列，不保留跨列和负边距。

- [ ] **Step 6: 实现平台轨道**

`PlatformRail.tsx` 接受：

```tsx
interface PlatformRailProps {
  readonly platforms: readonly ContentPlatform[]
}
```

使用 `platformLabels` 渲染一个可换行的语义列表：

- 桌面端为横向错位标签组，不使用无限 marquee。
- 移动端允许两列或自动换行。
- 标签是普通文本，不假装可点击。
- 不使用平台 logo，不伪造平台账号。

- [ ] **Step 7: 编排 ContentPage**

页面结构固定为五段：

1. 首屏：`GAOGE CONTENT`、`让每一份热爱持续被看见。`、一句不超过 20 个中文字的说明、真实 Skiing 背景视频的克制裁切。
2. 运营对象：三个不同尺寸的杂志式媒体块。
3. 平台矩阵：六个平台标签轨道。
4. 运营闭环：六项能力按 `策划 -> 生产 -> 分发 -> 传播 -> 承接 -> 复盘` 的阅读顺序排布，使用分段文案与留白，不使用六张相同功能卡。
5. `BrandPageShell` 页尾。

当 `contentProperties` 为空时，运营对象区域显示 `内容运营矩阵正在整理中`，平台和能力区仍按静态配置正常显示，不渲染空白大区。

页面入口：

```tsx
useBrandMetadata({
  description: '高歌旗下内容品牌、IP、多平台运营与社群能力。',
  title: '高歌内容 - 内容运营矩阵',
})
```

首屏可复用 Skiing 页已确认的远程视频地址作为品牌体育影像，但必须：

- 视频 `muted`、`autoPlay`、`loop`、`playsInline`、`aria-hidden="true"`。
- 覆盖暗色渐变确保文案对比度。
- reduced-motion 下通过 CSS 隐藏视频运动层，显示高歌体育静态分享图。
- 预留媒体比例，避免 CLS。

- [ ] **Step 8: 增加内容页集成测试**

在 `App.test.tsx` 加入：

```tsx
// Add fireEvent to the existing Testing Library import.
// import { fireEvent, render, screen, waitFor } from '@testing-library/react'

describe('content matrix route', () => {
  it('renders content properties, platforms and capabilities', async () => {
    renderRoute('/content')

    expect(await screen.findByRole('heading', { name: 'GAOGE CONTENT' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '让每一份热爱持续被看见。' })).toBeInTheDocument()
    expect(screen.getByText('高歌体育')).toBeInTheDocument()
    expect(screen.getByText('高歌超级联赛')).toBeInTheDocument()
    expect(screen.getByText('主理人个人 IP')).toBeInTheDocument()
    ;['公众号', '视频号', '小红书', '抖音', 'B 站', '社群与私域'].forEach((platform) => {
      expect(screen.getByText(platform)).toBeInTheDocument()
    })
    ;['内容策划', '多平台分发', '数据复盘'].forEach((capability) => {
      expect(screen.getByText(capability)).toBeInTheDocument()
    })

    const sports = screen.getByRole('link', { name: /高歌体育/ })
    expect(sports).toHaveAttribute('href', 'https://sports.gaoge.cc')
    expect(sports).toHaveAttribute('target', '_blank')
    expect(sports).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.queryByRole('link', { name: /高歌超级联赛/ })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: '返回高歌首页' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: '进入高歌数字' })).toHaveAttribute('href', '/digital')
    expect(screen.getByRole('link', { name: '内容' })).toHaveAttribute('aria-current', 'page')
    expect(document.title).toBe('高歌内容 - 内容运营矩阵')
  })

  it('updates metadata when crossing between formal brand pages', async () => {
    renderRoute('/digital')

    expect(await screen.findByRole('heading', { name: 'GAOGE DIGITAL' })).toBeInTheDocument()
    expect(document.title).toBe('高歌数字 - 数字产品矩阵')

    fireEvent.click(screen.getByRole('link', { name: '进入高歌内容' }))

    expect(await screen.findByRole('heading', { name: 'GAOGE CONTENT' })).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/content')
    expect(document.title).toBe('高歌内容 - 内容运营矩阵')
  })
})
```

- [ ] **Step 9: 运行内容页校验**

Run:

```bash
pnpm --filter @gaoge/app-brand test -- src/pages/content/data.test.ts src/App.test.tsx
pnpm --filter @gaoge/app-brand typecheck
```

Expected: PASS。

- [ ] **Step 10: 提交内容页**

```bash
git add \
  apps/brand/public/assets/brand/gaoge-sports-share.jpg \
  apps/brand/src/App.test.tsx \
  apps/brand/src/pages/content
git commit -m "feat(brand): add content operation matrix"
```

---

### Task 5: 完成视觉审计、响应式检查和全量验证

**Files:**

- Modify if required by findings: `apps/brand/src/styles.css`
- Modify if required by findings: `apps/brand/src/brand/components/*.tsx`
- Modify if required by findings: `apps/brand/src/pages/digital/**/*.tsx`
- Modify if required by findings: `apps/brand/src/pages/content/**/*.tsx`
- Modify if required by findings: `apps/brand/src/App.test.tsx`

**Interfaces:**

- Consumes: 所有前序任务交付
- Produces: 桌面、390px、减少动态效果下均可用的三个品牌路径

- [ ] **Step 1: 运行自动化校验**

Run:

```bash
pnpm --filter @gaoge/app-brand test
pnpm --filter @gaoge/app-brand typecheck
pnpm --filter @gaoge/app-brand build
pnpm exec stylelint "apps/brand/src/**/*.{css,scss,vue}"
git diff --check
```

Expected:

- Vitest 全部 PASS。
- TypeScript 无错误。
- Vite build 成功并输出 `/digital`、`/content` 所需懒加载 chunk。
- Stylelint 无错误。
- `git diff --check` 无空白错误。

- [ ] **Step 2: 启动 Brand 开发服务器**

Run:

```bash
pnpm dev:brand
```

Expected: Vite 输出本地地址，终端无编译错误。

- [ ] **Step 3: 用浏览器检查桌面端**

依次打开 `/`、`/digital`、`/content`，在 1440px 宽度检查：

- 导航不换行，高度不超过 80px。
- 首页三个角标都可聚焦和点击，数字与内容不打开新标签。
- 数字页首屏在初始视口内可读，Compass 为 1 + 2 布局主单元。
- 数字目录三类有明显宽度节奏，不是三列等宽卡片。
- 内容页三个运营对象具有不同媒体比例和跨列节奏。
- 页面不存在纯文本假截图、装饰状态点、重复 eyebrow、滚动提示或假数据。
- 页面横向滚动宽度等于视口宽度。
- 控制台无 React key、路由、资源或可访问性警告。

- [ ] **Step 4: 用浏览器检查移动端**

把 viewport 设为 `390 x 844`，再次检查三个路径：

- 无水平溢出、文字裁切或固定元素遮挡。
- 首页隐藏中央导航时，三个角标仍提供数字、内容和体育入口。
- 数字和内容矩阵全部收敛为单列或明确的两列标签，不保留桌面跨列。
- CTA 文案不换行。
- 焦点环不被 `overflow-hidden` 裁切。
- 视频或图片已预留空间，没有明显布局跳动。

- [ ] **Step 5: 检查减少动态效果**

模拟 `prefers-reduced-motion: reduce`：

- 首页和正式页面内容无需等待动画即可看到。
- 数字页淡入退化为静态。
- 内容首屏隐藏自动视频运动层，并显示静态高歌体育图。
- 所有 hover、focus 和链接功能仍然可用。

- [ ] **Step 6: 执行设计预检**

逐项确认：

- 页面可见文本和 `alt` 中没有 `—` 或 `–`。
- 数字页只使用冷灰单一强调色，内容页只使用暖红单一强调色。
- 页面表面全部属于同一暗色主题，没有中途反转成亮色区块。
- 导航和按钮使用全圆角，内容容器统一 `28px`，媒体统一 `24px`。
- 每页 eyebrow 数量不超过 `ceil(sectionCount / 3)`。
- 没有三个等宽功能卡，没有超过两个连续左右交替图文区。
- 所有外链均为安全新标签页，所有规划项均不是链接。
- 每个动画都用于首屏层级、内容进入或交互反馈。
- 每个页面所有可见文案语法自然，不包含无法证实的营销承诺。

可用以下命令辅助扫描：

```bash
rg -n "[—–]|(领先|赋能|革命性|99%|[0-9]+万用户)" \
  apps/brand/src/brand \
  apps/brand/src/pages
```

Expected: 无命中；若命中的是源代码语义而非可见文案，也要人工确认后再保留。

- [ ] **Step 7: 修复审计中发现的问题并重新验证**

只修改与本次页面相关的文件。每次修复后重跑：

```bash
pnpm --filter @gaoge/app-brand test
pnpm --filter @gaoge/app-brand typecheck
pnpm --filter @gaoge/app-brand build
pnpm exec stylelint "apps/brand/src/**/*.{css,scss,vue}"
git diff --check
```

Expected: 所有命令 PASS，浏览器三个路径无阻断问题。

- [ ] **Step 8: 提交最终视觉与验证修复**

先检查范围：

```bash
git status --short
git diff --stat
```

只暂存本计划产生且尚未提交的 Brand 文件，然后提交：

```bash
git commit -m "fix(brand): polish product matrix experience"
```

若审计没有产生额外代码修改，则不创建空提交。

---

## 最终完成条件

- `/`、`/digital`、`/content` 三个路径在桌面、390px 和减少动态效果环境中都可访问。
- 数字与内容入口为站内当前标签页，体育与真实产品站为安全新标签页。
- 数字页展示重点产品、三类完整矩阵和真实状态。
- 内容页展示运营对象、六个平台和六项运营闭环能力。
- 规划内容没有伪链接，媒体失败时不会留下空白或破坏布局。
- `/concepts`、三个当前概念路径和三个旧路径重定向全部保持通过。
- 测试、typecheck、build、stylelint 和 `git diff --check` 获得新鲜通过证据。
- 最终交付说明列出实际加入的媒体资产；若没有取得 Compass 真实截图，明确说明使用了文字视觉兜底。
