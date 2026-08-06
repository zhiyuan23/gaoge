# 高歌集团人物卡片紧凑化实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 缩小 `/group` 管理团队模块，并为 6 名管理人员与 20 名联赛董事加入统一的默认图标头像。

**Architecture:** 在集团页面私有组件目录新增无业务语义的 `DefaultAvatar` 展示组件，由管理团队与董事会共同复用。组织数据、人物昵称、20 席约束和页面路由保持不变，仅收敛卡片布局、字号与间距，并通过现有路由测试验证 26 个头像均已渲染。

**Tech Stack:** React 18、TypeScript、Tailwind CSS 3、Lucide React、Vitest、Testing Library、Vite

## Global Constraints

- 直接在现有 `main` 分支实施，不创建额外工作树。
- 不修改集团产业布局、高歌体育结构、组织数据、昵称、职责或 20 席顺序。
- 使用 `apps/brand` 已安装的 `lucide-react`，不新增依赖。
- 默认头像使用中性人物轮廓，不使用带状态、权限或职业含义的图标。
- 默认头像是装饰内容，辅助技术继续从昵称和职责获得人物信息。
- 管理团队视觉体量缩小约三分之一，集团负责人保留轻量强调。
- 低于 768px 时管理团队为单列，董事会保持两列，不产生水平溢出。
- 不新增动效，不使用真实照片，不虚构人物资料。
- 修改后必须通过 Brand 应用的 test、typecheck、build 和 Stylelint，并进行桌面与移动端浏览器检查。

---

## 文件结构

### 新增文件

- `apps/brand/src/pages/group/components/DefaultAvatar.tsx`：统一的页面私有默认人物头像。
- `apps/brand/src/pages/group/components/DefaultAvatar.test.tsx`：头像尺寸变体与可访问性测试。

### 修改文件

- `apps/brand/src/pages/group/components/LeadershipStructure.tsx`：使用默认头像并缩小负责人卡片。
- `apps/brand/src/pages/group/components/LeagueBoard.tsx`：为 20 个董事席位增加默认头像并收紧卡片高度。
- `apps/brand/src/App.test.tsx`：验证管理团队和董事会的头像数量。

---

### Task 1: 建立统一默认头像组件

**Files:**

- Create: `apps/brand/src/pages/group/components/DefaultAvatar.tsx`
- Create: `apps/brand/src/pages/group/components/DefaultAvatar.test.tsx`

**Interfaces:**

- Consumes: `UserRound` from `lucide-react`。
- Produces: `DefaultAvatar({ size?: 'compact' | 'standard' })` React 组件。
- Produces: `data-testid="default-avatar"` 与 `data-avatar-size`，供路由测试核对。

- [ ] **Step 1: 写默认头像组件测试**

在 `DefaultAvatar.test.tsx` 写入：

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import DefaultAvatar from './DefaultAvatar'

describe('DefaultAvatar', () => {
  it('renders a decorative standard avatar by default', () => {
    render(<DefaultAvatar />)

    const avatar = screen.getByTestId('default-avatar')
    expect(avatar).toHaveAttribute('aria-hidden', 'true')
    expect(avatar).toHaveAttribute('data-avatar-size', 'standard')
  })

  it('supports the compact director size', () => {
    render(<DefaultAvatar size="compact" />)

    expect(screen.getByTestId('default-avatar')).toHaveAttribute('data-avatar-size', 'compact')
  })
})
```

- [ ] **Step 2: 运行组件测试并确认失败**

Run:

```bash
pnpm --filter @gaoge/app-brand test -- src/pages/group/components/DefaultAvatar.test.tsx
```

Expected: FAIL，提示无法解析 `./DefaultAvatar`。

- [ ] **Step 3: 实现默认头像组件**

在 `DefaultAvatar.tsx` 写入：

```tsx
import { UserRound } from 'lucide-react'

interface DefaultAvatarProps {
  readonly size?: 'compact' | 'standard'
}

export default function DefaultAvatar({ size = 'standard' }: DefaultAvatarProps) {
  const compact = size === 'compact'

  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full border border-[rgb(var(--brand-accent)/0.28)] bg-[rgb(var(--brand-accent)/0.1)] text-[rgb(var(--brand-accent))] ${
        compact ? 'h-11 w-11' : 'h-14 w-14'
      }`}
      data-avatar-size={size}
      data-testid="default-avatar"
    >
      <UserRound className={compact ? 'h-5 w-5' : 'h-6 w-6'} strokeWidth={1.5} />
    </span>
  )
}
```

- [ ] **Step 4: 运行组件测试并确认通过**

Run:

```bash
pnpm --filter @gaoge/app-brand test -- src/pages/group/components/DefaultAvatar.test.tsx
```

Expected: PASS，2 项测试通过。

- [ ] **Step 5: 提交默认头像组件**

```bash
git add apps/brand/src/pages/group/components/DefaultAvatar.tsx apps/brand/src/pages/group/components/DefaultAvatar.test.tsx
git commit -m "feat(brand): add group default avatar"
```

---

### Task 2: 收紧管理团队人物卡片

**Files:**

- Modify: `apps/brand/src/pages/group/components/LeadershipStructure.tsx`
- Modify: `apps/brand/src/App.test.tsx`

**Interfaces:**

- Consumes: `DefaultAvatar({ size: 'standard' })`。
- Preserves: `data-testid="group-leader"` 与 `GroupLeader` 数据接口。
- Produces: 每张管理人员卡片内恰好一个 `data-testid="default-avatar"`。

- [ ] **Step 1: 扩展集团路由测试**

在 `App.test.tsx` 的 `group organization route` 用例中，将管理团队断言扩展为：

```tsx
expect(screen.getAllByTestId('group-leader')).toHaveLength(6)
expect(
  document.querySelectorAll('[data-testid="group-leader"] [data-testid="default-avatar"]'),
).toHaveLength(6)
```

- [ ] **Step 2: 运行集团路由测试并确认头像断言失败**

Run:

```bash
pnpm --filter @gaoge/app-brand test -- src/App.test.tsx
```

Expected: FAIL，管理团队内部默认头像数量为 0。

- [ ] **Step 3: 将 `LeaderCard` 改为紧凑人物结构**

在 `LeadershipStructure.tsx` 导入 `DefaultAvatar`，删除重复的 `GAOGE` 标签，将卡片主体改为：

```tsx
<article
  className={`group-leader-card flex min-h-28 items-center gap-5 rounded-[24px] border border-white/10 p-5 md:min-h-32 md:p-6 ${
    featured ? 'bg-[rgb(var(--brand-accent)/0.1)]' : ''
  }`}
  data-testid="group-leader"
>
  <DefaultAvatar />
  <div className="min-w-0">
    <h3
      className={`font-medium tracking-[-0.04em] text-white ${
        featured ? 'text-2xl md:text-3xl' : 'text-xl md:text-2xl'
      }`}
    >
      {leader.nickname}
    </h3>
    <p className="mt-2 text-sm leading-6 text-[rgb(var(--brand-muted))]">{leader.role}</p>
  </div>
</article>
```

将管理团队卡片区域的顶部间距从 `mt-14` 收紧为 `mt-10`，卡片间距从 `gap-4` 收紧为 `gap-3`。保留现有集团负责人、产业负责人和体育负责人的两级分组，集团负责人继续位于第一组左侧并使用强调底色；移动端仍依靠网格默认单列显示。

- [ ] **Step 4: 运行集团路由测试并确认通过**

Run:

```bash
pnpm --filter @gaoge/app-brand test -- src/App.test.tsx
```

Expected: PASS，管理团队有 6 张卡片和 6 个默认头像。

- [ ] **Step 5: 提交管理团队调整**

```bash
git add apps/brand/src/App.test.tsx apps/brand/src/pages/group/components/LeadershipStructure.tsx
git commit -m "feat(brand): compact group leadership cards"
```

---

### Task 3: 为 20 席董事会加入默认头像

**Files:**

- Modify: `apps/brand/src/pages/group/components/LeagueBoard.tsx`
- Modify: `apps/brand/src/App.test.tsx`

**Interfaces:**

- Consumes: `DefaultAvatar({ size: 'compact' })`。
- Preserves: `data-seat`、`data-testid="league-director"` 和恰好 20 席运行时约束。
- Produces: 每个董事席位内恰好一个 `data-testid="default-avatar"`。

- [ ] **Step 1: 扩展董事会头像数量断言**

在 `App.test.tsx` 的集团路由用例中增加：

```tsx
expect(
  document.querySelectorAll('[data-testid="league-director"] [data-testid="default-avatar"]'),
).toHaveLength(20)
expect(screen.getAllByTestId('default-avatar')).toHaveLength(26)
```

- [ ] **Step 2: 运行集团路由测试并确认董事头像断言失败**

Run:

```bash
pnpm --filter @gaoge/app-brand test -- src/App.test.tsx
```

Expected: FAIL，董事席位内部默认头像数量为 0，总头像数量为 6。

- [ ] **Step 3: 实现紧凑董事席位**

在 `LeagueBoard.tsx` 导入 `DefaultAvatar`，将列表顶部间距从 `mt-14` 调整为 `mt-12`，并将董事席位内容改为：

```tsx
<li
  className="group-director-seat flex min-h-36 min-w-0 flex-col items-start justify-between rounded-[20px] border border-white/10 p-4"
  data-seat={director.seat}
  data-testid="league-director"
  key={director.id}
>
  <DefaultAvatar size="compact" />
  <span className="break-all text-xs leading-5 text-white/80 md:text-sm">{director.nickname}</span>
</li>
```

保留 `grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-10`，确保移动端两列和桌面端 20 席矩阵不变。

- [ ] **Step 4: 运行集团路由测试并确认通过**

Run:

```bash
pnpm --filter @gaoge/app-brand test -- src/App.test.tsx
```

Expected: PASS，集团页面共渲染 26 个默认头像，其中董事会 20 个。

- [ ] **Step 5: 提交董事会调整**

```bash
git add apps/brand/src/App.test.tsx apps/brand/src/pages/group/components/LeagueBoard.tsx
git commit -m "feat(brand): add league director avatars"
```

---

### Task 4: 完整验证与视觉验收

**Files:**

- Verify: `apps/brand/src/pages/group/components/DefaultAvatar.tsx`
- Verify: `apps/brand/src/pages/group/components/LeadershipStructure.tsx`
- Verify: `apps/brand/src/pages/group/components/LeagueBoard.tsx`
- Verify: `apps/brand/src/App.test.tsx`

**Interfaces:**

- Consumes: 完成后的 `/group` 页面。
- Produces: 工程校验和浏览器验收证据。

- [ ] **Step 1: 运行 Brand 应用工程校验**

Run:

```bash
pnpm --filter @gaoge/app-brand test
pnpm --filter @gaoge/app-brand typecheck
pnpm --filter @gaoge/app-brand build
pnpm exec stylelint "apps/brand/src/**/*.{css,scss}"
```

Expected: 所有命令退出码为 0，测试无失败，生产构建成功。

- [ ] **Step 2: 运行设计预检**

Run:

```bash
rg -n "GAOGE|—|–" apps/brand/src/pages/group/components/LeadershipStructure.tsx apps/brand/src/pages/group/components/LeagueBoard.tsx apps/brand/src/pages/group/components/DefaultAvatar.tsx
git diff --check
```

Expected: 管理团队组件不再包含重复 `GAOGE` 标签；页面新增内容不含长破折号；`git diff --check` 无输出。

- [ ] **Step 3: 浏览器桌面端验收**

启动 Brand 应用并打开 `/group`，在桌面视口检查：

- 管理团队准确显示 6 个头像、昵称和职责。
- 管理团队卡片高度明显小于改版前版本，集团负责人仍有鼠尾草绿强调。
- 董事会准确显示 20 个头像和连续 1-20 席数据。
- 页面无横向溢出，控制台无错误或警告。

- [ ] **Step 4: 浏览器移动端验收**

在 390px 宽视口检查：

- 管理团队切换为单列紧凑卡片。
- 董事会保持两列，昵称不越界。
- 默认头像清晰但不压过昵称层级。
- 页面无横向溢出。

- [ ] **Step 5: 检查知识库影响与 Git 状态**

调用知识库 `impact_for_changes`，路径包含：

```text
apps/brand/src/App.test.tsx
apps/brand/src/pages/group/components/DefaultAvatar.tsx
apps/brand/src/pages/group/components/DefaultAvatar.test.tsx
apps/brand/src/pages/group/components/LeadershipStructure.tsx
apps/brand/src/pages/group/components/LeagueBoard.tsx
```

然后运行：

```bash
git status --short
git log -5 --oneline
```

Expected: 工作区干净，知识库缺失或冲突被明确记录。
