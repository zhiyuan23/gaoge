# Brand 首页手机端首屏层级优化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不改变桌面端首屏构图的前提下，将手机端三个能力入口改为紧凑玻璃标签，强化主标题层级，并移除首页移动端“了解高歌”入口。

**Architecture:** 保留 `BrandSignal` 作为三个能力入口的唯一语义按钮，在组件内部通过 Tailwind 响应式类切换手机端标签形态和桌面端现有形态。`SkiingHero` 只负责手机端位置与主标题字号，`BrandNavigation` 只移除首页移动端重复入口，不改动弹窗状态、映射和焦点恢复逻辑。

**Tech Stack:** React 19、TypeScript、Vite、Tailwind CSS、Vitest、Testing Library

## Global Constraints

- `< 768px` 使用紧凑能力标签，`>= 768px` 保留当前桌面能力大字、斜线、字号和位置。
- 手机端主标题使用约 `15vw`，三个能力英文使用约 `11px`，中文使用 `11-12px`。
- 每个能力入口的手机端点击高度至少为 `48px`。
- 保留 `active:scale-[0.98]`、可见焦点、现有弹窗映射和关闭后的焦点恢复。
- 手机首页移除“了解高歌”，非首页移动端当前领域标识不变。
- 不新增依赖、路由、接口、图标、编号或自动动画。
- 当前工作区已有同一批 Brand 首页改动，执行时只修改本计划列出的文件，不重置或覆盖其他未提交内容。

---

### Task 1: 锁定手机端层级和导航入口行为

**Files:**

- Modify: `apps/brand/src/App.test.tsx`
- Test: `apps/brand/src/App.test.tsx`

**Interfaces:**

- Consumes: `SkiingHero` 渲染的三个带可访问名称的能力按钮。
- Produces: 对手机端标签样式、按压反馈、弹窗语义以及“了解高歌”移除的回归约束。

- [x] **Step 1: 更新首页结构测试并补充手机端样式断言**

将当前“了解高歌”存在断言改为不存在，并为三个能力按钮增加共同断言：

```tsx
expect(screen.queryByRole('button', { name: '打开高歌品牌能力说明' })).not.toBeInTheDocument()

for (const name of ['打开体育能力说明', '打开数字能力说明', '打开内容能力说明']) {
  const button = screen.getByRole('button', { name })

  expect(button).toHaveAttribute('aria-haspopup', 'dialog')
  expect(button).toHaveClass('min-h-12')
  expect(button).toHaveClass('bg-black/35')
  expect(button).toHaveClass('touch-manipulation')
  expect(button).toHaveClass('md:bg-transparent')
  expect(button).toHaveClass('active:scale-[0.98]')
}
```

- [x] **Step 2: 运行定向测试确认失败**

Run: `pnpm --filter @gaoge/app-brand test -- App.test.tsx`

Expected: FAIL，原因包括首页仍存在“了解高歌”，且能力按钮尚未包含 `min-h-12`、`bg-black/35`、`touch-manipulation` 与 `md:bg-transparent`。

---

### Task 2: 实现手机端能力标签与主标题层级

**Files:**

- Modify: `apps/brand/src/concepts/skiing/components/BrandSignal.tsx`
- Modify: `apps/brand/src/concepts/skiing/components/SkiingHero.tsx`
- Test: `apps/brand/src/App.test.tsx`

**Interfaces:**

- Consumes: `BrandSignalProps` 现有的 `ariaLabel`、`className`、`dividerClassName`、`dividerPosition`、`label`、`onClick` 和 `value`。
- Produces: 同一按钮在手机端呈现紧凑玻璃标签，在桌面端恢复现有大字与斜线构图。

- [x] **Step 1: 为 `BrandSignal` 增加响应式双层级样式**

将按钮外层调整为手机端玻璃标签、桌面端透明容器：

```tsx
className={`${className} min-h-12 touch-manipulation rounded-full border border-white/15 bg-black/35 px-3 py-2 text-left shadow-[inset_0_1px_0_rgb(255_255_255_/_0.12)] backdrop-blur-md transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white active:scale-[0.98] md:min-h-0 md:rounded-[24px] md:border-0 md:bg-transparent md:px-0 md:py-0 md:shadow-none md:backdrop-blur-none`}
```

将内容调整为手机端单行标签、桌面端现有两行结构：

```tsx
<span className="flex items-center gap-2 md:block">
  <span
    className={`flex items-center gap-3 ${dividerPosition === 'before' ? 'md:justify-end' : ''}`}
  >
    {dividerPosition === 'before' ? divider : null}
    <span className="text-[11px] font-semibold tracking-[0.2em] text-white/90 md:text-4xl md:font-medium md:tracking-[-0.04em] md:text-white">
      {value}
    </span>
    {dividerPosition === 'after' ? divider : null}
  </span>
  <span
    className={`text-[11px] text-white/60 md:mt-1 md:block md:text-sm md:text-white/70 ${
      dividerPosition === 'before' ? 'md:text-right' : ''
    }`}
  >
    {label}
  </span>
</span>
```

- [x] **Step 2: 调整 `SkiingHero` 的手机端字号和位置**

使用移动端类强化主标题，并通过 `md:` 恢复桌面现状：

```tsx
className =
  'hero-title absolute left-4 top-[20%] text-[15vw] font-medium text-white md:left-10 md:top-[18%] md:text-[12vw]'
```

第二、第三行分别使用手机端 `top-[39%]` 和 `top-[58%]`，桌面端恢复 `top-[38%]` 和 `top-[58%]`。正文手机端移动到 `top-[48%]`，桌面端恢复 `top-[46%]`。

三个入口使用以下手机端位置并通过 `md:` 恢复桌面位置：

```tsx
className = 'absolute right-4 top-24 z-10 md:right-24 md:top-[14%]'
className =
  'absolute bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-5 z-10 md:bottom-24 md:left-20'
className =
  'absolute bottom-[max(1.5rem,env(safe-area-inset-bottom))] right-5 z-10 md:bottom-20 md:right-20'
```

- [x] **Step 3: 运行定向测试确认标签实现通过**

Run: `pnpm --filter @gaoge/app-brand test -- App.test.tsx`

Expected: 除“了解高歌”仍存在的断言外，三个能力标签样式和弹窗测试通过。

- [x] **Step 4: 为低高度横屏增加响应式回退**

浏览器在 `844x390` 稳定复现 `passion` 与底部两个能力入口重叠。根因是仅按 `md` 宽度切换桌面构图，手机横屏宽度达到 844px 后错误使用了桌面字号和位置。

为主标题、正文和能力标签增加稳定的语义类，并在 `apps/brand/src/styles.css` 中使用以下高度感知媒体查询恢复紧凑层级：

```css
@media (height <= 500px) and (orientation: landscape) {
  .skiing-page .hero-title {
    font-size: 15vh;
  }

  .skiing-page .hero-signal {
    min-height: 3rem;
    padding: 0.5rem 0.75rem;
    background: rgb(0 0 0 / 35%);
    border: 1px solid rgb(255 255 255 / 15%);
    border-radius: 9999px;
  }

  .skiing-page .brand-signal-value,
  .skiing-page .brand-signal-label {
    font-size: 11px;
  }
}
```

同时在该媒体查询中将三行标题、正文和三个能力入口恢复为与手机竖屏一致的低高度安全位置。完成后重复浏览器矩形相交检查，Expected: `overlaps: []` 且无水平溢出。

---

### Task 3: 移除手机首页“了解高歌”并完成验证

**Files:**

- Modify: `apps/brand/src/brand/components/BrandNavigation.tsx`
- Modify: `apps/brand/src/App.test.tsx`
- Modify: `docs/superpowers/plans/2026-08-05-brand-mobile-hero-hierarchy.md`
- Test: `apps/brand/src/App.test.tsx`

**Interfaces:**

- Consumes: `BrandNavigationProps.current` 和现有桌面 `brandAreas` 导航。
- Produces: 首页手机端只显示 GAOGE 标识，非首页移动端当前领域标识保持不变。

- [x] **Step 1: 删除首页移动端重复入口**

将 `BrandNavigation` 中手机端中心区域改为只在非首页渲染当前领域：

```tsx
{
  current !== 'home' ? (
    <span
      aria-label="当前品牌领域"
      className="col-start-2 row-start-1 grid h-11 place-items-center rounded-full bg-neutral-900/90 px-4 text-xs text-white/75 backdrop-blur md:hidden"
    >
      {current === 'digital' ? '数字' : '内容'}
    </span>
  ) : null
}
```

不要修改桌面端 `brandAreas` 按钮、弹窗状态、`openCapability` 或焦点恢复逻辑。

- [x] **Step 2: 运行 Brand 完整测试、类型检查和构建**

Run:

```bash
pnpm --filter @gaoge/app-brand test
pnpm --filter @gaoge/app-brand typecheck
pnpm --filter @gaoge/app-brand build
```

Expected: 全部通过，测试总数不少于当前 37 个。

- [x] **Step 3: 运行仓库质量检查**

Run:

```bash
pnpm lint
git diff --check
```

Expected: Prettier、ESLint、Stylelint 与差异空白检查全部通过。

- [x] **Step 4: 浏览器验证响应式布局**

在本地 Brand 首页依次检查：

- 375x812：三个能力标签无重叠、点击高度至少 48px、无横向滚动。
- 390x844：主标题明显大于能力标签，顶部无“了解高歌”。
- 844x390：横屏无标签与导航重叠，无横向滚动。
- 1440x900：桌面能力大字、斜线、位置和顶部导航保持现状。
- 三个标签分别打开体育、数字、内容弹窗，URL 不变，关闭后焦点返回触发按钮。
- 浏览器控制台无 error 或 warning。

- [x] **Step 5: 完成设计预检和知识库影响检查**

逐项确认触控目标、文字层级、焦点、按压反馈、reduced motion、桌面回归和可见文案；随后对以下路径调用知识库影响检查：

```text
apps/brand/src/App.test.tsx
apps/brand/src/brand/components/BrandNavigation.tsx
apps/brand/src/concepts/skiing/components/BrandSignal.tsx
apps/brand/src/concepts/skiing/components/SkiingHero.tsx
docs/superpowers/plans/2026-08-05-brand-mobile-hero-hierarchy.md
```

Expected: 记录知识库建议模式；若仓库仍缺少 source map，以当前源码和验证结果为准，不扩大本次代码范围。
