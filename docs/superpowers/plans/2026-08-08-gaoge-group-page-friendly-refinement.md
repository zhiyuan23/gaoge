# 高歌集团页面友好化调整实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在保留 `/group` 现有视觉语言和 20 人董事会数据的前提下，统一首页与集团页的品牌表达，加入三人集团管理层和集团愿景，并移除公开页面中的企业服务、协同交付及非营利/商业分类措辞。

**Architecture:** 继续使用 `apps/brand/src/pages/group/data.ts` 管理页面静态事实，`GroupPage` 只负责编排。复用现有人物卡片和默认头像组件，新增一个页面私有 `GroupVision` 展示组件；不新增依赖、接口或共享包抽象。

**Tech Stack:** React 18、TypeScript、React Router 6、Tailwind CSS 3、Vitest、Testing Library、Vite

## Global Constraints

- 以已确认的 `docs/superpowers/specs/2026-08-08-gaoge-group-page-friendly-refinement-design.md` 为唯一产品设计依据。
- 当前工作区已有与 `apps/brand` 和 `apps/sports` 重叠的未提交改动；不得回退、覆盖或顺带提交无关内容。
- 不删除 `BusinessCapabilities.tsx` 与 `DeliveryModel.tsx`；只从 `/group` 的公开渲染链路移除。
- 不改变联赛董事会现有 20 人的昵称、顺序、席位编号和恰好 20 人的运行时约束。
- 不修改首页能力弹窗现有四条品牌方向和品牌主张。
- 公开 `/group` 页面不得出现“非营利”“商业”“企业服务能力”“集团协同交付”“独立采购”“集团统筹”“体育内部支持”。
- 管理层只展示劳塔罗（集团主席）、齐达内（高歌足球俱乐部 CEO）、劳塔罗（高歌超级联赛运营负责人）。
- 不新增依赖、API、CMS、人物履历、真实头像或详情交互。
- 遵循现有无分号、单引号、Prettier、ESLint 和 Tailwind 内联工具类风格。
- 按仓库偏好完成整体实现后统一 verification，不采用严格 TDD。
- 因相关源文件已经包含用户在途改动，不自动创建实现提交；验证后保留工作区改动供用户统一审阅和提交。

---

## 文件结构

### 新增文件

- `apps/brand/src/pages/group/components/GroupVision.tsx`：集团愿景标题、核心主张与三条价值表达。

### 修改文件

- `apps/brand/src/brand/components/BrandNavigation.tsx`：集团页导航最大宽度和首页同款 Logo。
- `apps/brand/src/pages/group/types.ts`：事业部品牌方向字段及集团愿景条目类型。
- `apps/brand/src/pages/group/data.ts`：四个事业部、体育卡片、三人管理层与愿景静态文案。
- `apps/brand/src/pages/group/data.test.ts`：静态数据契约和 20 人董事会约束。
- `apps/brand/src/pages/group/components/IndustryOrbit.tsx`：显示品牌方向和品牌主张。
- `apps/brand/src/pages/group/components/GroupHero.tsx`：首屏辅助文案。
- `apps/brand/src/pages/group/components/SportsStructure.tsx`：体育模块友好化文案。
- `apps/brand/src/pages/group/components/LeadershipStructure.tsx`：三人集团管理层紧凑布局。
- `apps/brand/src/pages/group/components/LeagueBoard.tsx`：本届董事会标识和届次调整说明。
- `apps/brand/src/pages/group/GroupPage.tsx`：移除两个旧模块，加入管理层和集团愿景并调整元信息。
- `apps/brand/src/App.test.tsx`：验证完整页面结构、文案、Logo、导航宽度和禁用词。

---

### Task 1: 收敛集团页静态数据契约

**Files:**

- Modify: `apps/brand/src/pages/group/types.ts:1-47`
- Modify: `apps/brand/src/pages/group/data.ts:1-135`
- Modify: `apps/brand/src/pages/group/data.test.ts:1-68`

**Interfaces:**

- Produces: `GroupIndustry { id, name, direction, description }`。
- Produces: `GroupVisionItem { id, title, description }`。
- Produces: `groupIndustries`、`sportsEntities`、`groupLeaders`、`groupVisionItems`、`leagueDirectors`。
- Preserves: `businessCapabilities` 与 `deliveryModels`，仅供未删除的旧组件保持类型完整，不再进入公开页面。

- [ ] **Step 1: 将事业部性质字段改为品牌方向**

把 `GroupIndustry` 定义调整为：

```ts
export interface GroupIndustry {
  readonly description: string
  readonly direction: '产品矩阵' | '内容运营' | '影像创作' | '体育生态'
  readonly id: 'digital' | 'content' | 'film' | 'sports'
  readonly name: string
}
```

在同一文件增加：

```ts
export interface GroupVisionItem {
  readonly description: string
  readonly id: 'passion' | 'action' | 'together'
  readonly title: string
}
```

- [ ] **Step 2: 让四个事业部数据与首页弹窗完全一致**

将 `groupIndustries` 改为以下数据：

```ts
export const groupIndustries: readonly GroupIndustry[] = [
  {
    description: '以技术与产品思维，把想法转化为面向未来的数字能力。',
    direction: '产品矩阵',
    id: 'digital',
    name: '高歌数字',
  },
  {
    description: '以创意与内容思维，把热爱转化为持续生长的影响力。',
    direction: '内容运营',
    id: 'content',
    name: '高歌内容',
  },
  {
    description: '以影像与叙事思维，把想法转化为承载情感与表达的光影作品。',
    direction: '影像创作',
    id: 'film',
    name: '高歌影视',
  },
  {
    description: '以运动与连接的力量，把热爱转化为真实发生的共同体验。',
    direction: '体育生态',
    id: 'sports',
    name: '高歌体育',
  },
]
```

- [ ] **Step 3: 更新体育、管理层和愿景数据**

将 `sportsEntities` 的两条说明更新为：

```ts
export const sportsEntities: readonly SportsEntity[] = [
  {
    description: '一群因足球相聚的伙伴，一起训练、比赛，也一起享受每一次上场。',
    id: 'club',
    name: '高歌足球俱乐部',
  },
  {
    description: '为球友们持续组织的联赛，让熟悉的人和新的伙伴都能在球场相见。',
    id: 'league',
    name: '高歌超级联赛',
  },
]
```

将 `groupLeaders` 收敛为：

```ts
export const groupLeaders: readonly GroupLeader[] = [
  { id: 'group-chair', nickname: '劳塔罗', role: '集团主席', scope: 'group' },
  { id: 'club-ceo', nickname: '齐达内', role: '高歌足球俱乐部 CEO', scope: 'club' },
  {
    id: 'league-operator',
    nickname: '劳塔罗',
    role: '高歌超级联赛运营负责人',
    scope: 'league',
  },
]
```

新增愿景数组：

```ts
export const groupVisionItems: readonly GroupVisionItem[] = [
  {
    description: '从真正喜欢的事情开始，保持好奇，也保持行动。',
    id: 'passion',
    title: '因热爱出发',
  },
  {
    description: '用技术、内容、影像与体育，把想法带进真实生活。',
    id: 'action',
    title: '让想法发生',
  },
  {
    description: '珍惜每一次相遇，在共同创造中走得更远。',
    id: 'together',
    title: '与伙伴同行',
  },
]
```

- [ ] **Step 4: 更新静态数据测试**

在 `data.test.ts` 中保留 20 人原名单断言，删除对旧 `nature`、六人管理结构和交付模型公开口径的断言，新增：

```ts
expect(groupIndustries.map(({ direction }) => direction)).toEqual([
  '产品矩阵',
  '内容运营',
  '影像创作',
  '体育生态',
])
expect(groupLeaders.map(({ nickname, role }) => ({ nickname, role }))).toEqual([
  { nickname: '劳塔罗', role: '集团主席' },
  { nickname: '齐达内', role: '高歌足球俱乐部 CEO' },
  { nickname: '劳塔罗', role: '高歌超级联赛运营负责人' },
])
expect(groupVisionItems.map(({ id }) => id)).toEqual(['passion', 'action', 'together'])
```

同时精确断言四条事业部 `description` 和两条体育 `description` 与本计划一致。

---

### Task 2: 调整现有集团页模块的内容与结构

**Files:**

- Modify: `apps/brand/src/pages/group/components/IndustryOrbit.tsx:8-22`
- Modify: `apps/brand/src/pages/group/components/GroupHero.tsx:36-51`
- Modify: `apps/brand/src/pages/group/components/SportsStructure.tsx:12-59`
- Modify: `apps/brand/src/pages/group/components/LeadershipStructure.tsx:9-92`
- Modify: `apps/brand/src/pages/group/components/LeagueBoard.tsx:14-52`

**Interfaces:**

- Consumes: Task 1 的 `GroupIndustry.direction`、`sportsEntities`、`groupLeaders`。
- Preserves: `data-industry`、`data-testid="group-leader"`、`data-testid="league-director"` 和体育外链行为。
- Produces: 3 张管理层卡片、20 张董事席位卡片以及本届说明。

- [ ] **Step 1: 更新事业部节点和首屏文案**

在 `IndustryOrbit` 中将 `industry.nature` 替换为 `industry.direction`，保持品牌方向使用鼠尾草绿的小号标签，品牌主张继续使用正文样式。

在 `GroupHero` 中将辅助段落改为：

```tsx
<p className="mt-7 max-w-sm text-sm leading-7 text-[rgb(var(--brand-muted))]">
  让技术、内容、影像与体育从共同的热爱出发，彼此连接，也持续生长。
</p>
```

- [ ] **Step 2: 更新高歌体育模块语言**

将引导语改为 `因热爱相聚`，说明改为：

```tsx
将体育浪漫主义坚决贯彻到底。
```

继续从 `sportsEntities` 渲染两张外链卡片，不修改 URL、`target`、`rel`、hover 和键盘焦点样式。

- [ ] **Step 3: 简化集团管理层组件**

删除按 `scope` 拆分集团、事业部和体育负责人的派生逻辑，以及 `featured`、`subdued` 两套卡片布局。将标题改为 `集团管理层`，说明改为：

```tsx
从集团方向到球队与联赛，我们一起让热爱持续向前。
```

人物列表使用：

```tsx
<div className="mt-10 grid gap-3 md:grid-cols-3">
  {leaders.map((leader) => (
    <LeaderCard key={leader.id} leader={leader} />
  ))}
</div>
```

每张卡片保持一个使用 `lets-icons:user-alt-duotone` 的 `DefaultAvatar`、昵称和职务，移动端单列，桌面三列，不新增点击行为。

- [ ] **Step 4: 增加本届董事会说明**

在“联赛董事会”标题上方增加：

```tsx
<p className="mb-4 text-sm text-[rgb(var(--brand-accent))]">本届董事会成员</p>
```

将原说明替换为：

```tsx
20 位本届联赛董事会成员以热爱和投入，共同推动联赛持续向前。
```

把说明宽度从 `max-w-sm` 明确放宽到 `max-w-lg`，保留右侧 `20 席` 和现有列表布局。

---

### Task 3: 新增集团愿景并完成页面编排和导航统一

**Files:**

- Create: `apps/brand/src/pages/group/components/GroupVision.tsx`
- Modify: `apps/brand/src/pages/group/GroupPage.tsx:1-31`
- Modify: `apps/brand/src/brand/components/BrandNavigation.tsx:51-64,141-177`

**Interfaces:**

- `GroupVision` consumes `readonly GroupVisionItem[]` through prop `items`。
- `GroupPage` consumes `groupIndustries`、`sportsEntities`、`groupLeaders`、`leagueDirectors`、`groupVisionItems`。
- Preserves: `/group` 路由、`BrandPageShell current="group"` 和页脚。

- [ ] **Step 1: 创建集团愿景组件**

实现以下语义结构和响应式网格：

```tsx
import type { GroupVisionItem } from '@/pages/group/types'

interface GroupVisionProps {
  readonly items: readonly GroupVisionItem[]
}

export default function GroupVision({ items }: GroupVisionProps) {
  return (
    <section
      aria-labelledby="group-vision-title"
      className="mx-auto max-w-7xl px-6 py-24 md:px-10 md:py-32"
    >
      <p className="mb-4 text-sm text-[rgb(var(--brand-accent))]">GROUP VISION</p>
      <h2
        className="text-4xl font-medium tracking-[-0.06em] text-white md:text-6xl"
        id="group-vision-title"
      >
        集团愿景
      </h2>
      <p className="mt-6 max-w-3xl text-3xl leading-tight tracking-[-0.05em] text-white md:text-5xl">
        让每一份热爱，都有持续生长的可能。
      </p>

      <div className="mt-12 grid gap-3 md:grid-cols-3">
        {items.map((item) => (
          <article
            className="rounded-[24px] border border-white/10 bg-white/[0.025] p-6 md:min-h-52 md:p-7"
            key={item.id}
          >
            <h3 className="text-xl font-medium tracking-[-0.04em] text-white">{item.title}</h3>
            <p className="mt-4 text-sm leading-7 text-[rgb(var(--brand-muted))]">
              {item.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: 调整集团页编排和元信息**

从 `GroupPage` 删除 `BusinessCapabilities`、`DeliveryModel`、`businessCapabilities` 和 `deliveryModels` 的导入及渲染，加入 `LeadershipStructure`、`GroupVision`、`groupLeaders` 和 `groupVisionItems`。

页面顺序必须是：

```tsx
<GroupHero industries={groupIndustries} />
<SportsStructure entities={sportsEntities} />
<LeadershipStructure leaders={groupLeaders} />
<LeagueBoard directors={leagueDirectors} />
<GroupVision items={groupVisionItems} />
```

元信息改为：

```ts
useBrandMetadata({
  description:
    '认识高歌集团和数字、内容、影视、体育四个事业部，看见我们如何从热爱出发，让想法持续生长。',
  title: '高歌集团 - 让热爱持续生长',
})
```

- [ ] **Step 3: 扩大导航并统一 Logo**

在集团分支的 `<nav>` 上将 `max-w-7xl` 替换为 `max-w-[1440px]`。将集团页 Logo 调用从：

```tsx
<BrandMark />
```

改为：

```tsx
<BrandMark home />
```

不得修改其他页面分支的导航结构和能力弹窗行为。

---

### Task 4: 更新页面测试并完成统一验证

**Files:**

- Modify: `apps/brand/src/App.test.tsx:290-346`
- Modify: `apps/brand/src/pages/group/data.test.ts`

**Interfaces:**

- Verifies: Task 1–3 的静态数据、DOM 结构、导航视觉类名、文案和外链行为。
- Preserves: 首页能力弹窗、其他正式品牌路由和 20 人董事会既有测试。

- [ ] **Step 1: 更新 `/group` 路由断言**

将旧的集团页断言替换/扩展为以下检查：

```ts
expect(groupNavigation).toHaveClass('max-w-[1440px]')
expect(groupMark).toHaveClass('text-[14px]', '-rotate-[30deg]')
expect(document.title).toBe('高歌集团 - 让热爱持续生长')
;['产品矩阵', '内容运营', '影像创作', '体育生态'].forEach((direction) => {
  expect(screen.getByText(direction)).toBeInTheDocument()
})

expect(screen.getByRole('heading', { name: '集团管理层' })).toBeInTheDocument()
expect(screen.getAllByTestId('group-leader')).toHaveLength(3)
expect(screen.getByText('高歌足球俱乐部 CEO')).toBeInTheDocument()
expect(screen.getByText('高歌超级联赛运营负责人')).toBeInTheDocument()

expect(screen.getByText('本届董事会成员')).toBeInTheDocument()
expect(
  screen.getByText('20 位本届联赛董事会成员以热爱和投入，共同推动联赛持续向前。'),
).toBeInTheDocument()
expect(screen.getAllByTestId('league-director')).toHaveLength(20)
expect(screen.getAllByTestId('default-avatar')).toHaveLength(23)

expect(screen.getByRole('heading', { name: '集团愿景' })).toBeInTheDocument()
expect(screen.getByText('让每一份热爱，都有持续生长的可能。')).toBeInTheDocument()
;['因热爱出发', '让想法发生', '与伙伴同行'].forEach((title) => {
  expect(screen.getByRole('heading', { name: title })).toBeInTheDocument()
})
```

保留两张体育外链的 `href`、`target`、`rel` 断言。

- [ ] **Step 2: 增加公开页面禁用词断言**

在 `/group` 渲染完成后增加：

```ts
const pageCopy = document.body.textContent ?? ''

;['非营利', '商业', '企业服务能力', '集团协同交付', '独立采购', '集团统筹', '体育内部支持'].forEach(
  (term) => {
    expect(pageCopy).not.toContain(term)
  },
)
```

该断言只检查已渲染 `/group` 的公开内容，不扫描未渲染的旧组件源文件。

- [ ] **Step 3: 格式化本次修改文件**

运行：

```bash
pnpm exec prettier --write \
  apps/brand/src/brand/components/BrandNavigation.tsx \
  apps/brand/src/pages/group/GroupPage.tsx \
  apps/brand/src/pages/group/types.ts \
  apps/brand/src/pages/group/data.ts \
  apps/brand/src/pages/group/data.test.ts \
  apps/brand/src/pages/group/components/GroupHero.tsx \
  apps/brand/src/pages/group/components/GroupVision.tsx \
  apps/brand/src/pages/group/components/IndustryOrbit.tsx \
  apps/brand/src/pages/group/components/SportsStructure.tsx \
  apps/brand/src/pages/group/components/LeadershipStructure.tsx \
  apps/brand/src/pages/group/components/LeagueBoard.tsx \
  apps/brand/src/App.test.tsx
```

Expected: 命令退出码为 0，仅格式化列出的品牌项目文件。

- [ ] **Step 4: 运行定向数据与路由测试**

运行：

```bash
pnpm --filter @gaoge/app-brand test -- src/pages/group/data.test.ts src/App.test.tsx
```

Expected: 两个测试文件全部 PASS；集团页为 3 张管理层卡片、20 张董事席位卡片和 23 个默认头像。

- [ ] **Step 5: 运行 Brand 应用完整验证**

运行：

```bash
pnpm --filter @gaoge/app-brand test
pnpm --filter @gaoge/app-brand typecheck
pnpm --filter @gaoge/app-brand build
pnpm lint:style
```

Expected: 四条命令均退出码为 0。若根级 `lint:style` 因与本任务无关的现有文件失败，记录具体路径，并对本次触及的 CSS/TSX 文件单独运行等价检查。

- [ ] **Step 6: 浏览器检查 `/group`**

启动：

```bash
pnpm dev:brand
```

检查桌面（至少 1440px 宽）和移动端（约 390px 宽）：

- 导航容器桌面宽度比原 1280px 更舒展，仍居中且不贴边。
- 左上角 `G` 与首页保持相同旋转和字号。
- 页面顺序与本计划一致，无旧模块闪现或残留空白。
- 三人管理层与三项愿景在移动端为单列，不出现文字截断或水平滚动。
- 20 名董事仍完整显示，长昵称不溢出。
- 浏览器控制台无新增错误或 React key/DOM 警告。

- [ ] **Step 7: 核对知识库影响范围**

使用知识库的 `impact_for_changes` 检查本次修改路径。由于知识库中的集团实体仍使用旧的“非营利/商业”定位，而本次只是公开页面表达调整，不在本任务内直接改写知识库；最终交付中明确标注该口径差异，并建议后续由 `kb-maintainer` 单独确认是否更新正式知识。
