# Group Module Entry Links Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 Group 页数字与内容模块增加克制的标题入口，取消内容整卡跳转，并让跨页面导航稳定回到顶部。

**Architecture:** 新建共享 `GroupModuleLink` 统一两个标题入口的语义与视觉；新建路由级 `RouteScrollReset`，只在 `pathname` 变化时复位窗口滚动。内容卡片回归纯展示 `article`，保持原有内容与背景表现。

**Tech Stack:** React 18、React Router 6、TypeScript、Tailwind CSS、Vitest、Testing Library

## Global Constraints

- 直接在用户已授权的 `main` 分支修改。
- 不改变 `/group`、`/digital`、`/content` 路径与章节 hash 行为。
- 不新增依赖，不扩大到其他应用。
- 标题入口保持次级视觉权重，并具备完整键盘焦点状态。

---

### Task 1: 标题入口与非交互内容卡片

**Files:**

- Create: `apps/brand/src/pages/group/components/GroupModuleLink.tsx`
- Modify: `apps/brand/src/pages/group/components/DigitalStructure.tsx`
- Modify: `apps/brand/src/pages/group/components/ContentStructure.tsx`
- Test: `apps/brand/src/pages/group/components/ContentStructure.test.tsx`
- Test: `apps/brand/src/App.test.tsx`

**Interfaces:**

- Consumes: React Router `Link`，现有 `GroupContentOverview.href` 与固定 `/digital` 路径。
- Produces: `GroupModuleLink({ label, shortLabel, to })`，以及非交互 `group-content-card` article。

- [ ] **Step 1: 扩展测试断言**

断言 Group 页出现“进入高歌数字”和“进入高歌内容”两个链接，内容卡片元素为 `ARTICLE` 且内部没有链接。

- [ ] **Step 2: 实现共享入口与标题布局**

创建 32px 高的共享幽灵链接，在两个模块标题行右侧使用；移动端保持单行，完整无障碍名称分别对应两个事业群。

- [ ] **Step 3: 取消内容整卡链接**

将 `ContentStructure` 根卡片由 `Link` 改为 `article`，移除链接箭头、hover 位移、focus 与 active 链接样式。

- [ ] **Step 4: 运行组件与路由测试**

Run: `pnpm --filter @gaoge/app-brand test -- ContentStructure App`

Expected: 相关测试全部通过。

### Task 2: 路由滚动复位

**Files:**

- Create: `apps/brand/src/brand/components/RouteScrollReset.tsx`
- Modify: `apps/brand/src/App.tsx`
- Test: `apps/brand/src/App.test.tsx`

**Interfaces:**

- Consumes: React Router `useLocation().pathname`。
- Produces: 每次 pathname 变化调用 `window.scrollTo({ left: 0, top: 0 })`，hash 单独变化时不调用。

- [ ] **Step 1: 添加滚动回归测试**

从 `/digital` 点击现有“进入高歌内容”链接，断言目标路由为 `/content` 且最后一次滚动调用参数为 `{ left: 0, top: 0 }`。

- [ ] **Step 2: 实现路由级复位组件**

使用 `useLayoutEffect` 监听 `pathname` 并同步复位滚动，在 `App` 的路由树上方挂载一次。

- [ ] **Step 3: 运行完整 Brand 验证**

Run: `pnpm --filter @gaoge/app-brand test && pnpm --filter @gaoge/app-brand typecheck && pnpm build:brand`

Expected: 测试、类型检查和构建均以退出码 0 结束。

- [ ] **Step 4: 运行仓库样式与代码质量检查**

Run: `pnpm exec prettier --check apps/brand/src apps/brand/package.json docs/superpowers/specs/2026-08-10-group-module-entry-links-design.md docs/superpowers/plans/2026-08-10-group-module-entry-links.md && pnpm exec eslint apps/brand/src && pnpm exec stylelint "apps/brand/src/**/*.css"`

Expected: 所有检查以退出码 0 结束。

- [ ] **Step 5: 浏览器检查并提交**

在 1440px 与 390px 视口检查两个标题入口、内容卡片非交互状态及进入目标页后的顶部位置，然后提交本次改动。

### Task 3: 浏览器历史滚动位置恢复

**Files:**

- Modify: `apps/brand/src/brand/components/RouteScrollReset.tsx`
- Test: `apps/brand/src/App.test.tsx`

**Interfaces:**

- Consumes: React Router `useLocation()` 返回的 `pathname` 与 `key`，以及 `useNavigationType()` 返回的 `POP | PUSH | REPLACE`。
- Produces: `PUSH`/`REPLACE` 跨页面置顶，`POP` 恢复目标历史记录滚动位置，同页 hash 导航不干预。

- [ ] **Step 1: 添加失败的返回恢复测试**

在 `group organization route` 中加入以下场景：

```tsx
it('restores the prior group scroll position after returning from a module page', async () => {
  let scrollY = 1460
  const originalScrollY = Object.getOwnPropertyDescriptor(window, 'scrollY')
  const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation((options) => {
    if (typeof options === 'object') scrollY = options.top ?? 0
  })

  Object.defineProperty(window, 'scrollY', {
    configurable: true,
    get: () => scrollY,
  })

  renderRoute('/group')
  expect(await screen.findByRole('heading', { name: 'GAOGE GROUP' })).toBeInTheDocument()

  fireEvent.click(screen.getByRole('link', { name: '进入高歌内容' }))
  expect(await screen.findByRole('heading', { name: 'GAOGE CONTENT' })).toBeInTheDocument()
  expect(scrollY).toBe(0)

  fireEvent.click(screen.getByRole('button', { name: '测试返回' }))
  expect(await screen.findByRole('heading', { name: 'GAOGE GROUP' })).toBeInTheDocument()
  expect(scrollTo).toHaveBeenLastCalledWith({ left: 0, top: 1460 })

  scrollTo.mockRestore()
  if (originalScrollY) Object.defineProperty(window, 'scrollY', originalScrollY)
})
```

- [ ] **Step 2: 运行测试并确认 RED**

Run: `pnpm --filter @gaoge/app-brand test -- App`

Expected: 新测试失败，最后一次滚动调用仍为 `{ left: 0, top: 0 }`，证明当前实现返回时错误置顶。

- [ ] **Step 3: 实现按历史记录恢复**

将 `RouteScrollReset` 改为：

```tsx
import { useLayoutEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

export default function RouteScrollReset() {
  const location = useLocation()
  const navigationType = useNavigationType()
  const positions = useRef(new Map<string, number>())
  const previousPathname = useRef(location.pathname)

  useLayoutEffect(() => {
    const pathnameChanged = previousPathname.current !== location.pathname

    if (pathnameChanged) {
      const top = navigationType === 'POP' ? (positions.current.get(location.key) ?? 0) : 0
      window.scrollTo({ left: 0, top })
    }

    previousPathname.current = location.pathname

    return () => {
      positions.current.set(location.key, window.scrollY)
    }
  }, [location.key, location.pathname, navigationType])

  return null
}
```

- [ ] **Step 4: 运行测试并确认 GREEN**

Run: `pnpm --filter @gaoge/app-brand test -- App`

Expected: 新测试通过，并且现有测试无回归。

- [ ] **Step 5: 完整验证与浏览器检查**

Run: `pnpm --filter @gaoge/app-brand test && pnpm --filter @gaoge/app-brand typecheck && pnpm build:brand`

Expected: 测试、类型检查与构建全部以退出码 0 结束。浏览器中从 Group 中段进入内容页时 `scrollY === 0`，返回后恢复进入前位置。
