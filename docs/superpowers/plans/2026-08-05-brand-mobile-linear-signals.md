# Brand 手机端线性角标 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 仅在手机端将三个能力入口从圆角玻璃标签改为“短斜线 + 两层文字”，并重新安排 `enjoy / your / passion` 的位置以提升首屏层级。

**Architecture:** 继续由 `BrandSignal` 提供唯一的语义按钮、点击回调和焦点行为，在组件内部为手机端与桌面端分别渲染对应短线，避免用复杂 CSS 改写 DOM 顺序。`SkiingHero` 只调整手机端标题与正文位置，`styles.css` 只处理粗指针触控设备的低高度横屏回退；弹窗、导航和桌面构图不变。

**Tech Stack:** React 18、TypeScript、Vite、Tailwind CSS、Vitest、Testing Library

## Global Constraints

- `< 768px` 使用无底色的“短斜线 + 两层文字”，`>= 768px` 保留当前桌面能力大字、斜线、字号和位置。
- 手机端短线长度 `44-52px`、粗细 `1px`；英文约 `12px`，中文约 `11px`。
- 手机端主标题保持约 `15vw`，竖屏位置约为 `enjoy 4vw / 22%`、`your 4vw / 38%`、`passion 10vw / 61%`，正文约为 `24px / 49%`。
- 每个入口保留至少 `48px` 高的透明点击区域、`active:scale-[0.98]`、可见焦点、现有弹窗映射和焦点恢复。
- 手机端不使用可见背景、边框、圆角、阴影或背景模糊。
- 低高度横屏规则只作用于粗指针触控设备，不影响非触控桌面窗口。
- 不新增依赖、路由、接口、文案、图标或动画。
- 当前工作区已有同一批 Brand 首页改动；只修改本计划列出的文件，不重置或覆盖其他未提交内容。

---

### Task 1: 锁定手机端线性角标与标题位置

**Files:**

- Modify: `apps/brand/src/App.test.tsx`
- Modify: `apps/brand/src/concepts/skiing/components/SkiingHero.test.tsx`
- Test: `apps/brand/src/App.test.tsx`
- Test: `apps/brand/src/concepts/skiing/components/SkiingHero.test.tsx`

**Interfaces:**

- Consumes: `SkiingHero` 渲染的三个带可访问名称的能力按钮和三行标题。
- Produces: 对无玻璃底、透明点击区域、手机端短线和标题位置的回归约束。

- [x] **Step 1: 增加手机端样式结构测试**

在现有测试文件中增加以下用例：

```tsx
it('uses linear mobile signals and the refined mobile title rhythm', () => {
  const { container } = render(
    <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <SkiingHero />
    </MemoryRouter>,
  )

  for (const name of ['打开体育能力说明', '打开数字能力说明', '打开内容能力说明']) {
    const signal = screen.getByRole('button', { name })

    expect(signal).toHaveClass('hero-signal', 'min-h-12', 'touch-manipulation')
    expect(signal).toHaveClass('active:scale-[0.98]', 'md:min-h-0')
    expect(signal).not.toHaveClass('rounded-full', 'bg-black/35', 'backdrop-blur-md')
  }

  expect(container.querySelectorAll('.brand-signal-divider--mobile')).toHaveLength(3)
  expect(container.querySelectorAll('.brand-signal-divider--desktop')).toHaveLength(3)
  expect(screen.getByText('enjoy')).toHaveClass('left-[4vw]', 'top-[22%]')
  expect(screen.getByText('your')).toHaveClass('right-[4vw]', 'top-[38%]')
  expect(screen.getByText('passion')).toHaveClass('left-[10vw]', 'top-[61%]')
})
```

同时将 `App.test.tsx` 中上一版玻璃标签的 `bg-black/35` 与 `md:bg-transparent` 正向断言替换为：

```tsx
expect(button).not.toHaveClass('rounded-full', 'bg-black/35', 'backdrop-blur-md')
```

- [x] **Step 2: 运行定向测试确认失败**

Run: `pnpm --filter @gaoge/app-brand test -- SkiingHero.test.tsx`

Expected: FAIL，原因是按钮仍包含圆角玻璃类、尚未渲染手机端独立短线，标题仍使用旧位置。

### Task 2: 实现手机端线性角标和新标题节奏

**Files:**

- Modify: `apps/brand/src/concepts/skiing/components/BrandSignal.tsx`
- Modify: `apps/brand/src/concepts/skiing/components/SkiingHero.tsx`
- Modify: `apps/brand/src/styles.css`
- Test: `apps/brand/src/concepts/skiing/components/SkiingHero.test.tsx`

**Interfaces:**

- Consumes: `BrandSignalProps` 现有的 `ariaLabel`、`className`、`dividerClassName`、`dividerPosition`、`label`、`onClick` 和 `value`。
- Produces: 同一语义按钮在手机端显示线性角标、在桌面端保持原有大字与斜线，并为低高度触控横屏提供回退布局。

- [x] **Step 1: 为手机端和桌面端拆分短线表现**

在 `BrandSignal` 中保留现有桌面短线，并新增手机端短线：

```tsx
const mobileDivider = (
  <span
    aria-hidden="true"
    className={`brand-signal-divider brand-signal-divider--mobile block h-px w-12 bg-white/45 md:hidden ${dividerClassName}`}
  />
)

const desktopDivider = (
  <span
    aria-hidden="true"
    className={`brand-signal-divider brand-signal-divider--desktop hidden h-px w-24 bg-white/40 md:block ${dividerClassName}`}
  />
)
```

使用 `dividerPosition` 将手机端短线放在两层文字前方或后方；桌面端继续只在英文所在行插入短线。手机端文字块使用 `12px` 英文与 `11px` 中文，桌面端继续通过 `md:` 恢复 `text-4xl`、原字距和中文对齐。

- [x] **Step 2: 移除手机端可见容器并保留交互区域**

将按钮外层改为透明容器：

```tsx
className={`${className} hero-signal min-h-12 cursor-pointer touch-manipulation px-0 py-2 text-left transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white active:scale-[0.98] md:min-h-0 md:rounded-[24px] md:px-0 md:py-0`}
```

不要加入手机端背景、边框、圆角、阴影或 `backdrop-filter`。保留原生 `button`、`aria-haspopup="dialog"` 和 `onClick`。

- [x] **Step 3: 调整手机端标题和正文位置**

在 `SkiingHero` 中分别使用：

```tsx
className =
  'hero-title hero-title--enjoy absolute left-[4vw] top-[22%] text-[15vw] font-medium text-white md:left-10 md:top-[18%] md:text-[12vw]'
className =
  'hero-title hero-title--your absolute right-[4vw] top-[38%] text-[15vw] font-medium text-white md:right-10 md:top-[38%] md:text-[12vw]'
className =
  'hero-title hero-title--passion absolute left-[10vw] top-[61%] text-[15vw] font-medium text-white md:left-[28%] md:top-[58%] md:text-[12vw]'
```

正文手机端使用 `left-6 top-[49%]`，桌面端继续使用 `md:left-10 md:top-[46%]`。

- [x] **Step 4: 限定低高度横屏回退为触控设备**

将现有低高度横屏媒体查询改为：

```css
@media (height <= 500px) and (orientation: landscape) and (hover: none) and (pointer: coarse) {
```

在该查询中移除 `.hero-signal` 的背景、边框、圆角、阴影和模糊，强制显示 `.brand-signal-divider--mobile`、隐藏 `.brand-signal-divider--desktop`，并恢复两层小号文字。保持标题、正文和三个角标无重叠的低高度位置。

- [x] **Step 5: 运行定向测试确认通过**

Run: `pnpm --filter @gaoge/app-brand test -- SkiingHero.test.tsx`

Expected: PASS，两个 `SkiingHero` 用例均通过。

### Task 3: 完成回归与响应式验证

**Files:**

- Modify: `docs/superpowers/plans/2026-08-05-brand-mobile-linear-signals.md`
- Test: `apps/brand/src/concepts/skiing/components/SkiingHero.test.tsx`
- Test: `apps/brand/src/App.test.tsx`

**Interfaces:**

- Consumes: Task 2 产出的手机端线性角标和触控横屏回退。
- Produces: 测试、类型、构建、代码质量与关键视口均通过的可交付实现。

- [x] **Step 1: 运行 Brand 完整自动化检查**

Run:

```bash
pnpm --filter @gaoge/app-brand test
pnpm --filter @gaoge/app-brand typecheck
pnpm --filter @gaoge/app-brand build
```

Expected: 全部通过，测试总数不少于当前 37 个。

- [x] **Step 2: 运行仓库质量检查**

Run:

```bash
pnpm lint
git diff --check
```

Expected: Prettier、ESLint、Stylelint 与差异空白检查全部通过。

- [x] **Step 3: 验证关键视口和交互**

在本地 Brand 首页检查：

- `375x812` 与 `390x844`：三个角标无可见底色，短线与中英文层级清晰，标题、正文、角标不重叠，无横向滚动。
- `844x390` 粗指针触控模拟：使用手机端短线和小号文字，标题、正文、角标不重叠。
- `1440x900`：桌面能力大字、斜线、位置和顶部导航保持现状。
- 三个角标分别打开体育、数字、内容弹窗；URL 不变，关闭后焦点返回对应触发按钮。
- 浏览器控制台无 error 或 warning。

- [x] **Step 4: 完成最终差异审查**

Run: `git diff -- apps/brand/src/concepts/skiing/components/BrandSignal.tsx apps/brand/src/concepts/skiing/components/SkiingHero.tsx apps/brand/src/concepts/skiing/components/SkiingHero.test.tsx apps/brand/src/styles.css`

Expected: 只有本设计需要的手机端角标、标题位置、横屏触控限定和测试变化，没有弹窗逻辑、导航行为或桌面结构改动。
