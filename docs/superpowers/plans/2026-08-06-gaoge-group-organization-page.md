# 高歌集团组织架构品牌页实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `apps/brand` 新增公开的 `/group` 正式品牌页，以战略星图展示集团产业布局，并完整呈现高歌体育结构、集团管理人员占位信息和高歌超级联赛 20 席董事会。

**Architecture:** 页面使用 Brand 应用现有的 React Router、Tailwind CSS、Framer Motion 和正式品牌页骨架。组织事实集中在页面私有的类型与静态数据文件中，视觉组件按集团首屏、产业星图、体育结构、管理结构和董事会拆分；关系图之外始终保留可读文本结构，移动端切换为纵向布局。

**Tech Stack:** React 18、TypeScript、React Router 6、Tailwind CSS 3、Framer Motion 12、Vitest、Testing Library、Vite

## Global Constraints

- 正式页面路由必须是 `/group`，不得加入 `/concepts/*` 注册表。
- 页面使用冷黑、银灰和低饱和鼠尾草绿；鼠尾草绿是唯一强调色。
- 页面锁定现有 Brand 暗色主题，不在中间切换浅色区块。
- “高歌内容”是主显示名称，“高歌小绿本”是别名。
- 高歌数字链接 `/digital`，高歌内容链接 `/content`，高歌体育链接 `https://sports.gaoge.cc`。
- 未来领域不可点击，不得虚构未来产业名称。
- 管理人员第一版只展示昵称和职责，不虚构头像、履历或联系方式。
- 高歌超级联赛董事会必须恰好展示 20 名成员。
- 不新增第三方依赖，不抽取到 `packages/*`，不接入 API、CMS、筛选或人物详情弹窗。
- 动效只改变 `transform` 和 `opacity`，遵循 `prefers-reduced-motion`，不得使用 `window` 滚动监听。
- 桌面使用战略星图，低于 `768px` 明确切换为单列纵向结构，不得产生水平溢出。
- 可点击节点支持键盘焦点；关系图不能成为唯一的信息来源。
- 遵循仓库现有无分号、单引号、Prettier、ESLint 和 Tailwind 内联工具类风格。
- 实现完成后必须通过 Brand 应用的 typecheck、test、build，并进行桌面与移动端浏览器检查。

---

## 文件结构

### 新增文件

- `apps/brand/src/pages/group/types.ts`：页面私有的产业、负责人和董事会成员类型。
- `apps/brand/src/pages/group/data.ts`：产业、负责人、体育节点和 20 席董事会静态数据。
- `apps/brand/src/pages/group/data.test.ts`：链接、别名、未来状态、董事会数量和席位唯一性测试。
- `apps/brand/src/pages/group/components/GroupHero.tsx`：集团首屏、氛围图与主张。
- `apps/brand/src/pages/group/components/IndustryOrbit.tsx`：桌面战略星图及移动端纵向产业轨迹。
- `apps/brand/src/pages/group/components/SportsStructure.tsx`：高歌体育、高歌 FC 和高歌超级联赛结构。
- `apps/brand/src/pages/group/components/LeadershipStructure.tsx`：集团及业务负责人展示。
- `apps/brand/src/pages/group/components/LeagueBoard.tsx`：20 席董事会矩阵与昵称回退。
- `apps/brand/src/pages/group/GroupPage.tsx`：页面编排、元信息与正式品牌页骨架。
- `apps/brand/public/assets/brand/group-architecture.webp`：生成的暗色金属与绿玻璃抽象建筑氛围图。

### 修改文件

- `apps/brand/src/App.tsx`：懒加载并注册 `/group`。
- `apps/brand/src/App.test.tsx`：覆盖正式路由、页面结构、链接、导航和元信息。
- `apps/brand/src/brand/components/BrandNavigation.tsx`：增加 `group` 当前领域与右侧“集团”入口。
- `apps/brand/src/brand/components/BrandPageShell.tsx`：允许 `current="group"` 并设置集团页面主题属性。
- `apps/brand/src/styles.css`：增加集团主题令牌、星图轨道、媒体降级和减少动效规则。

---

### Task 1: 建立组织数据契约与真实性测试

**Files:**

- Create: `apps/brand/src/pages/group/types.ts`
- Create: `apps/brand/src/pages/group/data.ts`
- Create: `apps/brand/src/pages/group/data.test.ts`

**Interfaces:**

- Produces: `GroupIndustry`、`GroupLeader`、`LeagueDirector`、`SportsEntity` 类型。
- Produces: `groupIndustries`、`groupLeaders`、`sportsEntities`、`leagueDirectors` 只读数组。
- Consumers: 后续所有集团页面组件和路由测试。

- [ ] **Step 1: 写产业和董事会约束测试**

在 `data.test.ts` 写入明确断言：

```ts
import { describe, expect, it } from 'vitest'

import { groupIndustries, groupLeaders, leagueDirectors, sportsEntities } from './data'

describe('group organization data', () => {
  it('keeps confirmed industry names and destinations', () => {
    expect(groupIndustries).toEqual([
      expect.objectContaining({ href: '/digital', id: 'digital', name: '高歌数字' }),
      expect.objectContaining({
        alias: '高歌小绿本',
        href: '/content',
        id: 'content',
        name: '高歌内容',
      }),
      expect.objectContaining({
        href: 'https://sports.gaoge.cc',
        id: 'sports',
        name: '高歌体育',
        target: '_blank',
      }),
      expect.objectContaining({
        href: undefined,
        id: 'future',
        name: '未来领域',
        status: 'future',
      }),
    ])
  })

  it('keeps sports entities parallel and truthful', () => {
    expect(sportsEntities.map(({ name }) => name)).toEqual(['高歌 FC', '高歌超级联赛'])
  })

  it('contains the six confirmed leadership placeholders', () => {
    expect(groupLeaders).toHaveLength(6)
    expect(groupLeaders.map(({ scope }) => scope)).toEqual([
      'group',
      'digital',
      'content',
      'sports',
      'club',
      'league',
    ])
  })

  it('contains exactly twenty uniquely ordered league directors', () => {
    expect(leagueDirectors).toHaveLength(20)
    expect(leagueDirectors.map(({ seat }) => seat)).toEqual(
      Array.from({ length: 20 }, (_, index) => index + 1),
    )
    expect(new Set(leagueDirectors.map(({ id }) => id))).toHaveProperty('size', 20)
  })
})
```

- [ ] **Step 2: 运行测试并确认因模块不存在而失败**

Run:

```bash
pnpm --filter @gaoge/app-brand test -- src/pages/group/data.test.ts
```

Expected: FAIL，提示无法解析 `./data`。

- [ ] **Step 3: 定义页面私有类型**

在 `types.ts` 定义：

```ts
export interface GroupIndustry {
  readonly alias?: string
  readonly description: string
  readonly href?: string
  readonly id: 'digital' | 'content' | 'sports' | 'future'
  readonly name: string
  readonly status: 'active' | 'future'
  readonly target?: '_blank'
}

export interface GroupLeader {
  readonly avatar?: { readonly alt: string; readonly src: string }
  readonly id: string
  readonly nickname: string
  readonly role: string
  readonly scope: 'group' | 'digital' | 'content' | 'sports' | 'club' | 'league'
}

export interface LeagueDirector {
  readonly avatar?: { readonly alt: string; readonly src: string }
  readonly id: string
  readonly nickname: string
  readonly seat: number
}

export interface SportsEntity {
  readonly description: string
  readonly id: 'club' | 'league'
  readonly name: string
}
```

- [ ] **Step 4: 实现静态组织数据**

在 `data.ts` 导出以下事实：

```ts
import type { GroupIndustry, GroupLeader, LeagueDirector, SportsEntity } from './types'

export const groupIndustries: readonly GroupIndustry[] = [
  {
    description: '以技术与产品连接真实业务。',
    href: '/digital',
    id: 'digital',
    name: '高歌数字',
    status: 'active',
  },
  {
    alias: '高歌小绿本',
    description: '让内容、品牌与热爱持续生长。',
    href: '/content',
    id: 'content',
    name: '高歌内容',
    status: 'active',
  },
  {
    description: '连接球队、赛事与共同体验。',
    href: 'https://sports.gaoge.cc',
    id: 'sports',
    name: '高歌体育',
    status: 'active',
    target: '_blank',
  },
  { description: '为尚未抵达的事业保留空间。', id: 'future', name: '未来领域', status: 'future' },
]

export const sportsEntities: readonly SportsEntity[] = [
  { description: '集团现有球队', id: 'club', name: '高歌 FC' },
  { description: '集团运营的赛事品牌', id: 'league', name: '高歌超级联赛' },
]

export const groupLeaders: readonly GroupLeader[] = [
  { id: 'group-lead', nickname: '昵称01', role: '集团负责人', scope: 'group' },
  { id: 'digital-lead', nickname: '昵称02', role: '高歌数字负责人', scope: 'digital' },
  { id: 'content-lead', nickname: '昵称03', role: '高歌内容负责人', scope: 'content' },
  { id: 'sports-lead', nickname: '昵称04', role: '高歌体育负责人', scope: 'sports' },
  { id: 'club-lead', nickname: '昵称05', role: '高歌 FC 管理负责人', scope: 'club' },
  { id: 'league-lead', nickname: '昵称06', role: '高歌超级联赛运营负责人', scope: 'league' },
]

export const leagueDirectors: readonly LeagueDirector[] = Array.from(
  { length: 20 },
  (_, index) => ({
    id: `league-director-${index + 1}`,
    nickname: `董事昵称${String(index + 1).padStart(2, '0')}`,
    seat: index + 1,
  }),
)
```

- [ ] **Step 5: 运行数据测试和类型检查**

Run:

```bash
pnpm --filter @gaoge/app-brand test -- src/pages/group/data.test.ts
pnpm --filter @gaoge/app-brand typecheck
```

Expected: 两条命令均 PASS。

- [ ] **Step 6: 提交数据契约**

```bash
git add apps/brand/src/pages/group/types.ts apps/brand/src/pages/group/data.ts apps/brand/src/pages/group/data.test.ts
git commit -m "feat(brand): add group organization data"
```

---

### Task 2: 接入正式路由、导航与集团页面骨架

**Files:**

- Create: `apps/brand/src/pages/group/GroupPage.tsx`
- Modify: `apps/brand/src/App.tsx`
- Modify: `apps/brand/src/App.test.tsx`
- Modify: `apps/brand/src/brand/components/BrandNavigation.tsx`
- Modify: `apps/brand/src/brand/components/BrandPageShell.tsx`
- Modify: `apps/brand/src/styles.css`

**Interfaces:**

- Consumes: `groupIndustries`、`groupLeaders`、`sportsEntities`、`leagueDirectors`。
- Produces: 懒加载的 `GroupPage` 默认导出和 `/group` 正式路由。
- Produces: `BrandArea = 'home' | 'digital' | 'content' | 'group'`。

- [ ] **Step 1: 为正式路由和导航写失败测试**

在 `App.test.tsx` 的 formal brand routes 数据集中增加：

```ts
;['/group', 'GAOGE GROUP']
```

新增集团页测试：

```ts
describe('group organization route', () => {
  it('renders the public group structure and metadata', async () => {
    renderRoute('/group')

    expect(await screen.findByRole('heading', { name: 'GAOGE GROUP' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '连接热爱，生长事业。' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '集团' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByTestId('location')).toHaveTextContent('/group')
    expect(document.title).toBe('高歌集团 - 组织与产业版图')
  })
})
```

- [ ] **Step 2: 运行路由测试并确认失败**

Run:

```bash
pnpm --filter @gaoge/app-brand test -- src/App.test.tsx
```

Expected: FAIL，`/group` 当前被通配路由重定向到首页。

- [ ] **Step 3: 扩展正式品牌页当前区域类型**

在 `BrandNavigation.tsx`：

```ts
export type BrandArea = 'home' | 'digital' | 'content' | 'group'
```

在导航右侧增加：

```tsx
<NavLink
  aria-label="集团"
  className={({ isActive }) =>
    `col-start-3 row-start-1 justify-self-end rounded-full bg-neutral-900/90 px-5 py-3 text-sm text-white/70 backdrop-blur transition-colors hover:text-white ${isActive ? 'text-white ring-1 ring-white/25' : ''}`
  }
  to="/group"
>
  集团
</NavLink>
```

集团页移动端当前领域文案必须返回“集团”，不能沿用数字和内容二选一表达式。

在 `BrandPageShell.tsx` 将 `current` 扩展为 `'content' | 'digital' | 'group'`，其余职责保持不变。

- [ ] **Step 4: 创建最小可渲染 GroupPage**

先建立页面骨架：

```tsx
import BrandPageShell from '@/brand/components/BrandPageShell'
import { useBrandMetadata } from '@/brand/metadata'

export default function GroupPage() {
  useBrandMetadata({
    description: '了解高歌集团旗下高歌数字、高歌内容、高歌体育及管理团队与高歌超级联赛董事会结构。',
    title: '高歌集团 - 组织与产业版图',
  })

  return (
    <BrandPageShell current="group" crossLink={{ label: '进入高歌数字', to: '/digital' }}>
      <section className="mx-auto min-h-[100dvh] max-w-7xl px-6 pb-20 pt-24 md:px-10">
        <h1>GAOGE GROUP</h1>
        <h2>连接热爱，生长事业。</h2>
      </section>
    </BrandPageShell>
  )
}
```

- [ ] **Step 5: 注册懒加载路由和集团主题令牌**

在 `App.tsx` 增加：

```tsx
const GroupPage = lazy(() => import('@/pages/group/GroupPage'))

<Route path="/group" element={<LazyPageRoute component={GroupPage} />} />
```

在 `styles.css` 增加：

```css
.brand-matrix-page[data-brand-area='group'] {
  --brand-accent: 157 197 143;
  --brand-surface: 18 22 20;
  --brand-muted: 164 174 168;
}
```

- [ ] **Step 6: 运行路由测试和类型检查**

Run:

```bash
pnpm --filter @gaoge/app-brand test -- src/App.test.tsx
pnpm --filter @gaoge/app-brand typecheck
```

Expected: PASS，`/group` 保持正式路由，集团导航具有 `aria-current="page"`。

- [ ] **Step 7: 提交路由与页面骨架**

```bash
git add apps/brand/src/App.tsx apps/brand/src/App.test.tsx apps/brand/src/brand/components/BrandNavigation.tsx apps/brand/src/brand/components/BrandPageShell.tsx apps/brand/src/pages/group/GroupPage.tsx apps/brand/src/styles.css
git commit -m "feat(brand): add group page route"
```

---

### Task 3: 实现战略星图首屏与产业布局

**Files:**

- Create: `apps/brand/src/pages/group/components/GroupHero.tsx`
- Create: `apps/brand/src/pages/group/components/IndustryOrbit.tsx`
- Create: `apps/brand/public/assets/brand/group-architecture.webp`
- Modify: `apps/brand/src/pages/group/GroupPage.tsx`
- Modify: `apps/brand/src/App.test.tsx`
- Modify: `apps/brand/src/styles.css`

**Interfaces:**

- Consumes: `GroupIndustry` 和 `groupIndustries`。
- Produces: `GroupHero({ industries }: { readonly industries: readonly GroupIndustry[] })`。
- Produces: `IndustryOrbit({ industries }: { readonly industries: readonly GroupIndustry[] })`。

- [ ] **Step 1: 为产业链接和未来节点写失败测试**

在集团页测试中增加：

```ts
const industryLinks = screen.getAllByRole('link')
const digitalIndustryLink = industryLinks.find((link) => link.dataset.industry === 'digital')
const contentIndustryLink = industryLinks.find((link) => link.dataset.industry === 'content')
const sportsIndustryLink = industryLinks.find((link) => link.dataset.industry === 'sports')

expect(digitalIndustryLink).toHaveAttribute('href', '/digital')
expect(contentIndustryLink).toHaveAttribute('href', '/content')
expect(screen.getByText('高歌小绿本')).toBeInTheDocument()
expect(sportsIndustryLink).toHaveAttribute('href', 'https://sports.gaoge.cc')
expect(sportsIndustryLink).toHaveAttribute('target', '_blank')
expect(document.querySelector('[data-industry="future"]')?.tagName).toBe('ARTICLE')
```

- [ ] **Step 2: 运行集团页测试并确认产业内容缺失**

Run:

```bash
pnpm --filter @gaoge/app-brand test -- src/App.test.tsx
```

Expected: FAIL，尚未渲染产业节点。

- [ ] **Step 3: 生成首屏氛围图**

使用 ImageGen 生成横向 `16:10` 位图，提示词包含：

```text
Abstract premium architectural photograph for Gaoge Group, near-black steel arcs forming orbital connections, restrained sage green glass, cold silver highlights, deep negative space for Chinese headline, no people, no logos, no words, no neon, no purple, cinematic but realistic material photography, wide 16:10 composition
```

将最终图片保存为 `apps/brand/public/assets/brand/group-architecture.webp`。确认图片无文字、无标识、无明显伪影，且右侧结构区域不会压住左侧标题。

- [ ] **Step 4: 实现可访问的产业节点渲染器**

`IndustryOrbit` 使用一个共享渲染函数区分站内、站外和未来节点：

```tsx
function IndustryNode({ industry }: { readonly industry: GroupIndustry }) {
  const content = (
    <>
      <span>{industry.name}</span>
      {industry.alias ? <span>{industry.alias}</span> : null}
      <span>{industry.description}</span>
    </>
  )

  if (!industry.href) return <article data-industry={industry.id}>{content}</article>
  if (industry.target === '_blank') {
    return (
      <a data-industry={industry.id} href={industry.href} rel="noopener noreferrer" target="_blank">
        {content}
      </a>
    )
  }
  return (
    <Link data-industry={industry.id} to={industry.href}>
      {content}
    </Link>
  )
}
```

组件同时输出：

- `md:block` 的桌面轨道星图。
- `md:hidden` 的移动端纵向轨迹。
- 中心节点“高歌集团”。
- 四个产业节点和真实文字说明。
- 仅用于组织关系的 CSS 轨道线，不用手写装饰 SVG。

- [ ] **Step 5: 实现首屏与进入动效**

`GroupHero`：

- 使用 `<img src="/assets/brand/group-architecture.webp">` 作为低对比度背景。
- 使用渐变遮罩保证文字对比度。
- 主标题总共只包含英文标识、主张和一句 20 字以内说明。
- 使用 `motion.div` 和 `useReducedMotion()` 实现一次性进入动画。
- 将 `IndustryOrbit` 放在右侧，移动端放在标题下方。

动效参数统一使用 `ease: [0.16, 1, 0.3, 1]`，持续时间控制在 `0.45-0.7s`，减少动效时 `initial={false}`。

- [ ] **Step 6: 增加星图主题样式与降级**

在 `styles.css` 增加以下语义样式范围：

```css
.group-orbit-ring {
  position: absolute;
  inset: 8%;
  border: 1px solid rgb(240 245 241 / 14%);
  border-radius: 999px;
}

.group-orbit-node {
  border: 1px solid rgb(240 245 241 / 14%);
  background: rgb(18 22 20 / 88%);
  border-radius: 1.25rem;
  transition:
    border-color 220ms ease,
    color 220ms ease,
    transform 220ms ease;
}

.group-orbit-node:is(:hover, :focus-visible) {
  color: rgb(var(--brand-accent));
  border-color: rgb(var(--brand-accent) / 62%);
  transform: translateY(-3px);
}

.group-orbit-core {
  border: 1px solid rgb(var(--brand-accent) / 55%);
  background: rgb(13 17 15 / 94%);
  border-radius: 999px;
}

.group-orbit-link {
  position: absolute;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgb(var(--brand-accent) / 35%), transparent);
  transform-origin: center;
}
```

使用 `@media (prefers-reduced-motion: no-preference)` 为轨道提供 18-24 秒的轻微缩放呼吸，只改变 `transform` 和 `opacity`。在 `prefers-reduced-motion: reduce` 中禁用动画。

- [ ] **Step 7: 编排首屏并运行测试**

在 `GroupPage` 中传入 `groupIndustries`：

```tsx
<GroupHero industries={groupIndustries} />
```

Run:

```bash
pnpm --filter @gaoge/app-brand test -- src/App.test.tsx
pnpm --filter @gaoge/app-brand typecheck
```

Expected: PASS，四个产业节点和所有链接行为正确。

- [ ] **Step 8: 提交首屏与产业星图**

```bash
git add apps/brand/src/pages/group/components/GroupHero.tsx apps/brand/src/pages/group/components/IndustryOrbit.tsx apps/brand/src/pages/group/GroupPage.tsx apps/brand/src/App.test.tsx apps/brand/src/styles.css apps/brand/public/assets/brand/group-architecture.webp
git commit -m "feat(brand): build group industry orbit"
```

---

### Task 4: 实现体育结构、管理人员和 20 席董事会

**Files:**

- Create: `apps/brand/src/pages/group/components/SportsStructure.tsx`
- Create: `apps/brand/src/pages/group/components/LeadershipStructure.tsx`
- Create: `apps/brand/src/pages/group/components/LeagueBoard.tsx`
- Modify: `apps/brand/src/pages/group/GroupPage.tsx`
- Modify: `apps/brand/src/App.test.tsx`

**Interfaces:**

- Consumes: `SportsEntity`、`GroupLeader`、`LeagueDirector`。
- Produces: `SportsStructure({ entities }: { readonly entities: readonly SportsEntity[] })`。
- Produces: `LeadershipStructure({ leaders }: { readonly leaders: readonly GroupLeader[] })`。
- Produces: `LeagueBoard({ directors }: { readonly directors: readonly LeagueDirector[] })`。

- [ ] **Step 1: 为体育层级和人员数量写失败测试**

在集团页测试中增加：

```ts
expect(screen.getByRole('heading', { name: '高歌体育' })).toBeInTheDocument()
expect(screen.getByRole('heading', { name: '高歌 FC' })).toBeInTheDocument()
expect(screen.getByRole('heading', { name: '高歌超级联赛' })).toBeInTheDocument()
expect(screen.getByRole('heading', { name: '管理团队' })).toBeInTheDocument()
expect(screen.getAllByTestId('group-leader')).toHaveLength(6)
expect(screen.getByRole('heading', { name: '联赛董事会' })).toBeInTheDocument()
expect(screen.getAllByTestId('league-director')).toHaveLength(20)
```

- [ ] **Step 2: 运行集团页测试并确认结构内容缺失**

Run:

```bash
pnpm --filter @gaoge/app-brand test -- src/App.test.tsx
```

Expected: FAIL，体育和治理组件尚未渲染。

- [ ] **Step 3: 实现 SportsStructure**

组件使用语义化 `<section>` 和两个真实业务节点：

```tsx
<section aria-labelledby="sports-structure-title">
  <h2 id="sports-structure-title">高歌体育</h2>
  <div className="grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
    {entities.map((entity) => (
      <article key={entity.id}>
        <h3>{entity.name}</h3>
        <p>{entity.description}</p>
      </article>
    ))}
  </div>
</section>
```

高歌 FC 和高歌超级联赛必须表现为并行节点，联赛节点通过后续版面连接运营负责人和董事会。

- [ ] **Step 4: 实现 LeadershipStructure**

按 `scope` 分成集团、三大业务和体育执行三组。每个负责人使用：

```tsx
<article data-testid="group-leader">
  <span aria-hidden="true">{leader.nickname.slice(0, 1)}</span>
  <h3>{leader.nickname}</h3>
  <p>{leader.role}</p>
</article>
```

不要显示通用头像图标。空数组时显示“团队信息整理中”，不要渲染空卡片。

- [ ] **Step 5: 实现 LeagueBoard**

组件在开发环境主动防止错误席位数量：

```tsx
if (directors.length !== 20) {
  throw new Error(`LeagueBoard requires 20 directors, received ${directors.length}`)
}
```

使用 `<ol>` 保留辅助技术读取顺序，每项包含昵称与 `data-testid="league-director"`。不要向访客显示技术性的席位编号。图片字段存在时使用 `MediaWithFallback` 或组件内等价昵称回退；第一版无图片时直接显示昵称文字席位。

- [ ] **Step 6: 在 GroupPage 中完成章节编排**

按设计顺序组合：

```tsx
<GroupHero industries={groupIndustries} />
<SportsStructure entities={sportsEntities} />
<LeadershipStructure leaders={groupLeaders} />
<LeagueBoard directors={leagueDirectors} />
<section aria-labelledby="future-title" className="mx-auto max-w-7xl px-6 py-24 md:px-10 md:py-32">
  <h2 id="future-title">持续生长中的新领域</h2>
  <p>开放的轨道，为尚未抵达的事业保留空间。</p>
</section>
```

未来章节只显示开放轨道和“持续生长中的新领域”，不添加链接或虚构名称。

- [ ] **Step 7: 运行页面测试和类型检查**

Run:

```bash
pnpm --filter @gaoge/app-brand test -- src/App.test.tsx src/pages/group/data.test.ts
pnpm --filter @gaoge/app-brand typecheck
```

Expected: PASS，6 名负责人和 20 名董事全部渲染。

- [ ] **Step 8: 提交体育与治理结构**

```bash
git add apps/brand/src/pages/group/components/SportsStructure.tsx apps/brand/src/pages/group/components/LeadershipStructure.tsx apps/brand/src/pages/group/components/LeagueBoard.tsx apps/brand/src/pages/group/GroupPage.tsx apps/brand/src/App.test.tsx
git commit -m "feat(brand): add group leadership structure"
```

---

### Task 5: 视觉精修、响应式验收与完整验证

**Files:**

- Modify: `apps/brand/src/pages/group/GroupPage.tsx`
- Modify: `apps/brand/src/pages/group/components/GroupHero.tsx`
- Modify: `apps/brand/src/pages/group/components/IndustryOrbit.tsx`
- Modify: `apps/brand/src/pages/group/components/SportsStructure.tsx`
- Modify: `apps/brand/src/pages/group/components/LeadershipStructure.tsx`
- Modify: `apps/brand/src/pages/group/components/LeagueBoard.tsx`
- Modify: `apps/brand/src/styles.css`
- Test: `apps/brand/src/App.test.tsx`
- Test: `apps/brand/src/pages/group/data.test.ts`

**Interfaces:**

- Consumes: Task 1 到 Task 4 的全部公共接口。
- Produces: 可发布的 `/group` 页面和新鲜验证证据。

- [ ] **Step 1: 完成设计预检**

逐项检查并修正：

- 首屏在 `1440x900` 下完整显示主张和星图。
- 标题桌面不超过两行，说明不超过 20 个中文字符。
- 页面只有鼠尾草绿一种强调色。
- 卡片使用一致的柔和圆角，按钮使用一致的全圆角。
- 不出现紫色光晕、科技蓝霓虹、三张等宽通用卡、装饰性状态点和假数据。
- 页面可见文案不包含破折号字符 `—` 或 `–`。
- 章节眉题数量不超过总章节数三分之一向上取整。
- 20 名董事完整可见，不需要展开操作。
- 所有交互元素具有 `:hover`、`:active` 和 `:focus-visible` 状态。

- [ ] **Step 2: 完成响应式与减少动效样式**

检查以下视口：

- `1440x900`：首屏双栏、完整星图、董事会 5 列或 10 列。
- `1024x768`：导航单行、星图不与标题重叠。
- `768x1024`：平板结构清晰，没有连接线错位。
- `390x844`：产业为纵向轨迹，体育节点上下排列，董事会两列或三列。
- `360x800`：无水平溢出，导航和长职责文案不截断。

在浏览器模拟 `prefers-reduced-motion: reduce`，确认轨道、进入动画和自动运动全部停用。

- [ ] **Step 3: 运行定向工程验证**

Run:

```bash
pnpm --filter @gaoge/app-brand typecheck
pnpm --filter @gaoge/app-brand test
pnpm --filter @gaoge/app-brand build
```

Expected: 三条命令均退出码 0。

- [ ] **Step 4: 启动 Brand 本地服务并进行浏览器验收**

Run:

```bash
pnpm dev:brand
```

在 `/group` 检查：

- 桌面、平板和移动端视觉层级。
- 站内链接、体育外链和未来非链接行为。
- 键盘 Tab 顺序和焦点可见性。
- 20 席董事会完整性。
- 首屏图片请求、布局偏移和失败回退。
- 控制台无 React key、可访问性、资源加载或运行时错误。

- [ ] **Step 5: 运行知识库影响检查**

对以下改动路径调用 `impact_for_changes`：

```text
apps/brand/src/App.tsx
apps/brand/src/App.test.tsx
apps/brand/src/brand/components/BrandNavigation.tsx
apps/brand/src/brand/components/BrandPageShell.tsx
apps/brand/src/pages/group
apps/brand/src/styles.css
apps/brand/public/assets/brand/group-architecture.webp
```

记录返回的知识页影响、缺失映射和是否需要 `kb-maintainer` 后续。知识库内容不得覆盖新鲜源码证据。

- [ ] **Step 6: 检查最终差异并提交视觉成品**

Run:

```bash
git diff --check
git status --short
```

确认只包含本功能相关文件后提交：

```bash
git add apps/brand/src/App.tsx apps/brand/src/App.test.tsx apps/brand/src/brand/components/BrandNavigation.tsx apps/brand/src/brand/components/BrandPageShell.tsx apps/brand/src/pages/group apps/brand/src/styles.css apps/brand/public/assets/brand/group-architecture.webp
git commit -m "feat(brand): polish group organization page"
```

- [ ] **Step 7: 提交后重新运行完成性验证**

Run:

```bash
pnpm --filter @gaoge/app-brand typecheck
pnpm --filter @gaoge/app-brand test
pnpm --filter @gaoge/app-brand build
git status --short
```

Expected: typecheck、test、build 全部通过，工作区没有遗漏的本功能改动。
