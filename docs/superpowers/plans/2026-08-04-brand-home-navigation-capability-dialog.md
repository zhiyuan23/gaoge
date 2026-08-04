# Brand 首页导航能力说明弹窗实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 Brand 首页顶部的四个领域导航改为不跳页的能力说明弹窗，同时保持正式矩阵页和首页其他入口的现有跳转行为。

**Architecture:** 继续由 `BrandNavigation` 负责导航渲染和首页弹窗状态，根据 `current` 区分首页按钮与正式页面链接。能力内容保留为组件附近的静态类型化数据，弹窗只在 `current === 'home'` 时渲染，并在现有草稿基础上补齐焦点进入、焦点恢复和关闭行为。

**Tech Stack:** React 18、TypeScript、React Router 6、Tailwind CSS、Vitest、Testing Library

## Global Constraints

- 只调整 Brand 首页顶部导航，不改变 `/digital` 和 `/content` 正式页面的导航行为。
- 首页顶部的“数字、内容、体育、未来”全部改为按钮，点击后打开对应能力说明弹窗。
- 弹窗只承载能力说明，不提供站内或站外二次跳转按钮。
- 首页其他入口保持现状，包括首屏内数字、内容和体育的品牌入口。
- 移动端点击顶部中央“高歌”入口后可以打开弹窗，并在弹窗内切换四个能力领域。
- 不新增依赖、全局状态、通用弹窗组件或远程内容配置。
- 当前工作区包含其他未提交的 Brand 概念页改动；只编辑本计划列出的文件，并在暂存或提交前逐项核对差异。

---

## 文件结构

- Modify: `apps/brand/src/brand/components/BrandNavigation.tsx`
  - 根据 `current` 渲染首页能力按钮或正式页面导航。
  - 维护能力静态数据、弹窗状态、滚动锁定和焦点恢复。
- Test: `apps/brand/src/App.test.tsx`
  - 覆盖首页不跳转弹窗、四领域切换、三种关闭方式、焦点恢复和正式页面导航回归。

### Task 1: 首页能力弹窗与正式页面导航边界

**Files:**

- Modify: `apps/brand/src/brand/components/BrandNavigation.tsx`
- Test: `apps/brand/src/App.test.tsx`

**Interfaces:**

- Consumes: `BrandNavigationProps.current: 'home' | 'digital' | 'content'`
- Produces: 首页领域按钮的 `aria-haspopup="dialog"`、弹窗 `#brand-capability-dialog`、正式页面原有 `NavLink` 与体育外链
- Preserves: 首页首屏中的“进入数字产品”“进入内容创造”“进入高歌体育”入口

- [x] **Step 1: 收窄并补充失败测试**

把首页导航断言放在首页路径，并验证点击后不改变路由、弹窗不含二次跳转：

```tsx
it('opens capability details from homepage navigation without changing route', async () => {
  renderRoute('/')

  const digitalButton = await screen.findByRole('button', { name: '数字' })
  fireEvent.click(digitalButton)

  expect(screen.getByTestId('location')).toHaveTextContent('/')
  expect(screen.getByRole('dialog')).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: '数字' })).toBeInTheDocument()
  expect(screen.getByText('产品矩阵')).toBeInTheDocument()
  expect(screen.getByText('以技术与产品思维，把想法转化为面向未来的数字能力。')).toBeInTheDocument()
  expect(screen.queryByRole('link', { name: '查看数字产品矩阵' })).not.toBeInTheDocument()
})
```

在同一组测试中通过弹窗内按钮切换并核对四类内容：

```tsx
const dialog = screen.getByRole('dialog')

fireEvent.click(within(dialog).getByRole('button', { name: '内容' }))
expect(within(dialog).getByRole('heading', { name: '内容' })).toBeInTheDocument()
expect(within(dialog).getByText('内容运营')).toBeInTheDocument()

fireEvent.click(within(dialog).getByRole('button', { name: '体育' }))
expect(within(dialog).getByRole('heading', { name: '体育' })).toBeInTheDocument()
expect(within(dialog).getByText('体育生态')).toBeInTheDocument()

fireEvent.click(within(dialog).getByRole('button', { name: '未来' }))
expect(within(dialog).getByRole('heading', { name: '未来' })).toBeInTheDocument()
expect(within(dialog).getByText('领域拓展中')).toBeInTheDocument()
```

补充关闭方式和焦点恢复测试：

```tsx
it('closes the capability dialog and restores focus', async () => {
  renderRoute('/')

  const trigger = await screen.findByRole('button', { name: '数字' })
  fireEvent.click(trigger)

  const closeButton = screen.getByRole('button', { name: '关闭能力说明' })
  await waitFor(() => expect(closeButton).toHaveFocus())

  fireEvent.keyDown(document, { key: 'Escape' })

  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  await waitFor(() => expect(trigger).toHaveFocus())
})
```

补充正式页面仍使用链接的回归断言：

```tsx
expect(screen.getByRole('link', { name: '数字' })).toHaveAttribute('aria-current', 'page')
expect(screen.getByRole('link', { name: '内容' })).toHaveAttribute('href', '/content')
expect(screen.getByRole('link', { name: '体育' })).toHaveAttribute(
  'href',
  'https://sports.gaoge.cc',
)
```

- [x] **Step 2: 运行定向测试确认现有草稿不满足边界**

Run:

```bash
pnpm --filter @gaoge/app-brand test -- App.test.tsx
```

Expected: FAIL，至少显示正式页面导航仍为按钮、弹窗仍包含二次跳转，或焦点行为缺失。

- [x] **Step 3: 按首页与正式页面分支渲染领域导航**

在 `BrandNavigation.tsx` 中恢复 `NavLink` 并保留类型化能力数据。首页分支使用按钮：

```tsx
if (current === 'home') {
  return (
    <button
      aria-controls="brand-capability-dialog"
      aria-expanded={activeArea === area.key}
      aria-haspopup="dialog"
      className={className}
      onClick={(event) => openCapability(area.key, event.currentTarget)}
      type="button"
    >
      {area.label}
    </button>
  )
}
```

正式页面分支恢复现有站内链接、体育外链和未来状态：

```tsx
if (area.key === 'digital' || area.key === 'content') {
  return (
    <NavLink className={className} to={`/${area.key}`}>
      {area.label}
    </NavLink>
  )
}

if (area.key === 'sports') {
  return (
    <a
      className={className}
      href="https://sports.gaoge.cc"
      rel="noopener noreferrer"
      target="_blank"
    >
      {area.label}
    </a>
  )
}

return (
  <span
    aria-label="未来，领域拓展中"
    className={`${className} cursor-default text-neutral-500`}
    title="领域拓展中"
  >
    {area.label}
  </span>
)
```

移动端中央入口只在首页使用按钮；正式页面继续使用不可点击的当前领域标签。

- [x] **Step 4: 收敛弹窗内容并补齐焦点行为**

增加触发按钮和关闭按钮引用：

```tsx
const triggerRef = useRef<HTMLButtonElement | null>(null)
const closeButtonRef = useRef<HTMLButtonElement | null>(null)
const isDialogOpen = activeArea !== null

function openCapability(area: CapabilityArea, trigger: HTMLButtonElement) {
  triggerRef.current = trigger
  setActiveArea(area)
}
```

以 `isDialogOpen` 作为 effect 依赖，避免在弹窗内切换领域时错误恢复焦点：

```tsx
useEffect(() => {
  if (!isDialogOpen) return

  const previousOverflow = document.body.style.overflow
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') setActiveArea(null)
  }

  document.body.style.overflow = 'hidden'
  document.addEventListener('keydown', handleKeyDown)
  closeButtonRef.current?.focus()

  return () => {
    document.body.style.overflow = previousOverflow
    document.removeEventListener('keydown', handleKeyDown)
    triggerRef.current?.focus()
  }
}, [isDialogOpen])
```

弹窗只在首页与有效能力同时存在时渲染：

```tsx
{
  current === 'home' && activeCapability ? (
    <div
      aria-describedby="brand-capability-dialog-copy"
      aria-labelledby="brand-capability-dialog-title"
      aria-modal="true"
      id="brand-capability-dialog"
      role="dialog"
    >
      {/* 遮罩、关闭按钮、能力标题、状态、说明和领域切换按钮 */}
    </div>
  ) : null
}
```

把能力说明段落关联到 `brand-capability-dialog-copy`，将关闭按钮连接 `closeButtonRef`，删除“查看数字产品矩阵”“查看内容运营矩阵”“访问高歌体育”和“能力拓展中”操作区。体育状态统一改为 spec 中确认的“体育生态”。

- [x] **Step 5: 运行定向测试**

Run:

```bash
pnpm --filter @gaoge/app-brand test -- App.test.tsx
```

Expected: PASS，`App.test.tsx` 全部测试通过。

- [x] **Step 6: 运行 Brand 类型检查与构建**

Run:

```bash
pnpm --filter @gaoge/app-brand typecheck
pnpm --filter @gaoge/app-brand build
```

Expected: 两个命令均以退出码 `0` 完成，TypeScript 无错误，Vite 生成 `apps/brand/dist`。

- [x] **Step 7: 检查任务差异**

Run:

```bash
git diff --check -- apps/brand/src/brand/components/BrandNavigation.tsx apps/brand/src/App.test.tsx
git diff -- apps/brand/src/brand/components/BrandNavigation.tsx apps/brand/src/App.test.tsx
```

Expected: 无空白错误；差异只包含首页导航弹窗、正式页面导航回归及其测试。若同一测试文件中存在任务开始前已有的概念路由变更，保留它们且不宣称为本任务成果。

- [x] **Step 8: 有条件地提交实现**

仅当能够精确隔离本任务差异时暂存并提交：

```bash
git add -p apps/brand/src/brand/components/BrandNavigation.tsx apps/brand/src/App.test.tsx
git diff --cached --check
git diff --cached --name-only
git commit -m "fix(brand): show homepage capability dialogs"
```

Expected: 暂存区只包含本任务相关 hunk。若现有同文件改动无法安全拆分，则保持实现未提交，并在交付说明中明确原因。

执行结果：`App.test.tsx` 同时包含任务开始前已有的概念路由改动，未暂存或提交实现文件，避免把无关改动带入提交。
