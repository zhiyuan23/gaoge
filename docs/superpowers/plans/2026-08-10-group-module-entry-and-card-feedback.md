# Group Module Entry and Card Feedback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 统一 Group 页三个事业模块的右上角入口，并让内容与体育卡片保留视觉反馈但不再承担跳转。

**Architecture:** 扩展 `GroupModuleLink` 以同时支持 React Router 内部链接和新窗口外部链接，三个模块共用同一入口组件与眉题行布局。体育实体卡片和内容卡片保持原生 `article` 语义，仅使用 CSS hover/active 状态提供视觉反馈。

**Tech Stack:** React 18、React Router 6、TypeScript、Tailwind CSS、Vitest、Testing Library

## Global Constraints

- 直接在用户已授权的 `main` 分支修改。
- 不新增依赖，不改变 `/digital`、`/content` 和 `https://sports.gaoge.cc` 目标。
- 体育与内容卡片不添加链接、按钮角色、`tabIndex` 或空点击处理。
- 三个模块入口位于眉题行右侧，移动端保持同一行且不溢出。

---

### Task 1: 添加失败的模块入口与卡片语义测试

**Files:**

- Modify: `apps/brand/src/App.test.tsx`
- Modify: `apps/brand/src/pages/group/components/ContentStructure.test.tsx`

**Interfaces:**

- Consumes: Group 页现有模块标题、眉题、卡片和链接语义。
- Produces: 体育标题入口、三个入口位置、体育非链接卡片及内容/体育反馈类名的回归契约。

- [ ] **Step 1: 更新 Group 路由断言**

将旧的体育卡片链接断言替换为：

```tsx
const sportsEntry = screen.getByRole('link', { name: '进入高歌体育' })
expect(sportsEntry).toHaveAttribute('href', 'https://sports.gaoge.cc')
expect(sportsEntry).toHaveAttribute('target', '_blank')
expect(sportsEntry).toHaveAttribute('rel', 'noopener noreferrer')

const sportsCards = screen.getAllByTestId('group-sports-entity')
expect(sportsCards).toHaveLength(2)
sportsCards.forEach((card) => {
  expect(card.tagName).toBe('ARTICLE')
  expect(card.querySelector('a')).not.toBeInTheDocument()
  expect(card).toHaveClass('hover:-translate-y-1', 'active:scale-[0.985]')
})
```

对数字、内容和体育三个 section 分别断言眉题与入口拥有同一个父元素，而主标题位于下一行。

- [ ] **Step 2: 更新内容卡片反馈断言**

在 `ContentStructure.test.tsx` 中断言 `group-content-card` 同时包含 `hover:-translate-y-1`、`hover:border-white/25` 和 `active:scale-[0.985]`，并继续断言内部不存在链接。

- [ ] **Step 3: 运行测试并确认 RED**

Run: `pnpm --filter @gaoge/app-brand test -- App ContentStructure`

Expected: 测试因缺少“进入高歌体育”、体育卡片仍为链接、入口仍与标题同行及内容卡片缺少反馈类名而失败。

### Task 2: 统一三个模块入口

**Files:**

- Modify: `apps/brand/src/pages/group/components/GroupModuleLink.tsx`
- Modify: `apps/brand/src/pages/group/components/DigitalStructure.tsx`
- Modify: `apps/brand/src/pages/group/components/ContentStructure.tsx`
- Modify: `apps/brand/src/pages/group/components/SportsStructure.tsx`

**Interfaces:**

- Consumes: 内部目标 `/digital | /content`，外部目标 `https://sports.gaoge.cc`。
- Produces: `GroupModuleLink` 判别联合 props，内部使用 `Link`，外部使用带安全属性的 `a`。

- [ ] **Step 1: 扩展共享入口组件**

将 props 改为：

```tsx
type GroupModuleLinkProps = {
  readonly label: string
  readonly shortLabel: string
} & (
  | { readonly href: string; readonly to?: never }
  | { readonly href?: never; readonly to: '/content' | '/digital' }
)
```

`href` 分支输出 `target="_blank" rel="noopener noreferrer"` 的 `a`，`to` 分支保持 React Router `Link`。

- [ ] **Step 2: 移动数字与内容入口**

把眉题和 `GroupModuleLink` 放入 `flex items-start justify-between gap-4` 容器，主标题改为该容器之后的独立元素并使用 `mt-4` 保持现有 16px 垂直间距。

- [ ] **Step 3: 添加体育入口**

体育眉题行加入：

```tsx
<GroupModuleLink href="https://sports.gaoge.cc" label="进入高歌体育" shortLabel="进入体育" />
```

主标题和说明文字保持现有字号与间距。

### Task 3: 将体育与内容卡片统一为非跳转反馈卡片

**Files:**

- Modify: `apps/brand/src/pages/group/components/SportsStructure.tsx`
- Modify: `apps/brand/src/pages/group/components/ContentStructure.tsx`

**Interfaces:**

- Consumes: 现有卡片内容、背景类名与圆角系统。
- Produces: 不可导航的 `article` 卡片，以及一致的 hover/active 反馈。

- [ ] **Step 1: 移除体育卡片跳转语义**

将实体根元素从 `a` 改为 `article`，删除 `href`、`target`、`rel`、链接 `aria-label`、focus-visible 类名和右上角 `ArrowUpRight`，加入 `data-testid="group-sports-entity"`。

- [ ] **Step 2: 保留体育卡片反馈**

保留或加入以下类名：

```text
transition-[border-color,transform] duration-200
hover:-translate-y-1 hover:border-white/25
active:translate-y-0 active:scale-[0.985]
```

- [ ] **Step 3: 为内容卡片加入相同反馈**

在 `group-content-card` 上加入 `group` 与同一组 transition、hover 和 active 类名，不增加任何事件处理或交互语义。

- [ ] **Step 4: 运行测试并确认 GREEN**

Run: `pnpm --filter @gaoge/app-brand test -- App ContentStructure`

Expected: 新增与现有测试全部通过。

### Task 4: 完整验证与浏览器验收

**Files:**

- Verify: `apps/brand/src/pages/group/components/*.tsx`
- Verify: `apps/brand/src/App.test.tsx`

**Interfaces:**

- Consumes: 已实现的 Group 页面入口与卡片反馈。
- Produces: 桌面端和移动端布局、链接语义、非跳转行为与工程质量证据。

- [ ] **Step 1: 运行完整自动化校验**

Run: `pnpm --filter @gaoge/app-brand test && pnpm --filter @gaoge/app-brand typecheck && pnpm build:brand`

Expected: 测试、类型检查与构建以退出码 0 结束。

- [ ] **Step 2: 运行格式与质量检查**

Run: `pnpm exec prettier --check apps/brand/src docs/superpowers/specs/2026-08-10-group-module-entry-and-card-feedback-design.md docs/superpowers/plans/2026-08-10-group-module-entry-and-card-feedback.md && pnpm exec eslint apps/brand/src && pnpm exec stylelint "apps/brand/src/**/*.css"`

Expected: 所有检查以退出码 0 结束。

- [ ] **Step 3: 浏览器检查**

在 1440px 与 390px 视口确认三个入口位于眉题行右上角，体育入口可跳转，内容和体育卡片悬停/按压有反馈且点击不改变 URL。

- [ ] **Step 4: 提交 main**

```bash
git add apps/brand/src/App.test.tsx apps/brand/src/pages/group/components/ContentStructure.test.tsx apps/brand/src/pages/group/components/GroupModuleLink.tsx apps/brand/src/pages/group/components/DigitalStructure.tsx apps/brand/src/pages/group/components/ContentStructure.tsx apps/brand/src/pages/group/components/SportsStructure.tsx docs/superpowers/plans/2026-08-10-group-module-entry-and-card-feedback.md
git commit -m "feat(brand): unify group module interactions"
```
