# Brand 首页体验精修 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在保持 Brand 首页现有信息架构和品牌语言的前提下，完善能力弹窗的模态可访问性、克制动效、暗色玻璃材质、移动端触控和首页视频降级。

**Architecture:** `BrandNavigation` 继续维护能力数据和交互状态，但把当前 `role="dialog"` 容器升级为原生 `<dialog>`，通过 `showModal()`、关闭阶段状态和短定时器协调退出动画与焦点恢复。`SkiingHero` 使用从当前背景视频提取的专用静态帧作为 poster，并根据 `useReducedMotion()` 决定是否渲染背景视频；材质与动画类收敛在 `styles.css`。

**Tech Stack:** React 18、TypeScript、React Router 6、Framer Motion 12、Tailwind CSS 3、原生 HTMLDialogElement、Vitest、Testing Library

## Global Constraints

- 不新增依赖、全局状态或通用弹窗抽象。
- 不改变 `/digital`、`/content` 和 `https://sports.gaoge.cc` 的导航行为。
- 保留现有四领域能力文案和首页首屏的三个正式入口。
- 弹窗只动画 `transform` 和 `opacity`，不动画模糊值。
- `prefers-reduced-motion` 下取消位移、缩放和背景视频。
- 关键移动端触控目标至少 44px 高。
- 删除无效开发者占位按钮，不新增未经确认的联系方式。

---

### Task 1: 原生模态行为与回归测试

**Files:**

- Modify: `apps/brand/src/App.test.tsx`
- Modify: `apps/brand/src/brand/components/BrandNavigation.tsx`

**Interfaces:**

- Consumes: `BrandNavigationProps.current`、`CapabilityArea`、现有 `openCapability(area, trigger)` 交互入口
- Produces: `HTMLDialogElement` 引用、`isClosing` 状态、`requestClose()` 关闭入口、原生 `open` 模态状态

- [ ] **Step 1: 写失败测试**

在现有首页弹窗测试中加入 `HTMLDialogElement` 测试垫片，并断言弹窗元素为 `DIALOG` 且打开后具有 `open` 属性；增加移动端入口文案和开发者占位按钮消失的断言。

```tsx
expect(screen.getByRole('dialog').tagName).toBe('DIALOG')
expect(screen.getByRole('dialog')).toHaveAttribute('open')
expect(screen.getByRole('button', { name: '打开高歌品牌能力说明' })).toHaveTextContent('了解高歌')
expect(screen.queryByRole('button', { name: '开发者联系方式，敬请期待' })).not.toBeInTheDocument()
```

- [ ] **Step 2: 运行定向测试确认失败**

Run: `pnpm --filter @gaoge/app-brand test -- App.test.tsx`

Expected: FAIL，当前弹窗元素是 `DIV`、不存在 `open` 属性、移动端文案仍为“高歌”且开发者占位按钮仍存在。

- [x] **Step 3: 实现原生 dialog 生命周期**

在 `BrandNavigation` 内增加 `dialogRef`、`isClosing`、关闭定时器和 `requestClose()`。当 `activeArea` 出现时调用 `showModal()`；关闭时先进入退出阶段，170ms 后调用 `dialog.close()`、清空能力状态并恢复触发按钮焦点。处理原生 `cancel` 事件并复用 `requestClose()`。

- [x] **Step 4: 收敛导航入口**

将移动端可见文案改为“了解高歌”，入口高度提升到 44px；移除右侧 disabled 开发者按钮并使用左右等宽弹性列保持中央对齐。384px 及以下隐藏左侧 `GAOGE` 文字，只保留品牌标记，避免窄屏重叠。

- [x] **Step 5: 运行定向测试确认通过**

Run: `pnpm --filter @gaoge/app-brand test -- App.test.tsx`

Expected: PASS，原有四领域切换、路由保持和三种关闭方式测试继续通过。

### Task 2: 弹窗动效与暗色玻璃材质

**Files:**

- Modify: `apps/brand/src/brand/components/BrandNavigation.tsx`
- Modify: `apps/brand/src/styles.css`
- Test: `apps/brand/src/App.test.tsx`

**Interfaces:**

- Consumes: `isClosing`、`activeCapability.key`、`.brand-capability-dialog` 和 `.brand-capability-panel`
- Produces: `data-closing`、按 key 重新进入的 `.brand-capability-copy` 内容容器、固定玻璃材质回退

- [x] **Step 1: 写失败测试**

断言 dialog 根据关闭状态暴露 `data-closing`，面板包含稳定材质类，领域内容容器以能力 key 重新挂载。

```tsx
expect(screen.getByRole('dialog')).toHaveClass('brand-capability-dialog')
expect(within(screen.getByRole('dialog')).getByTestId('capability-panel')).toHaveClass(
  'brand-capability-panel',
)
```

- [x] **Step 2: 运行定向测试确认失败**

Run: `pnpm --filter @gaoge/app-brand test -- App.test.tsx`

Expected: FAIL，当前组件尚未提供材质类和面板测试标识。

- [x] **Step 3: 实现材质和状态动画**

遮罩使用 55% 黑色；面板使用深色半透明渐变、24px 固定模糊、1px 半透明边框、顶部内高光和柔和投影。通过 `data-closing` 控制 200/150ms 遮罩透明度与 260/170ms 面板透明度、10px 位移和 0.985 缩放。

- [x] **Step 4: 实现领域内容切换**

以 `activeCapability.key` 作为内容容器 key，通过 `.brand-capability-copy` 应用 140ms 透明度和 4px 位移动画；状态小字提升为 `text-white/55`。

- [x] **Step 5: 添加降级样式**

在 `@supports not (backdrop-filter: blur(1px))` 下使用接近实色的深黑背景；在 `prefers-reduced-motion: reduce` 下把所有 Brand 弹窗动画压缩为 0.01ms、移除 transform，并跳过 180ms 关闭等待。

- [x] **Step 6: 运行定向测试**

Run: `pnpm --filter @gaoge/app-brand test -- App.test.tsx`

Expected: PASS。

### Task 3: 首页视频静态降级

**Files:**

- Modify: `apps/brand/src/App.test.tsx`
- Modify: `apps/brand/src/concepts/skiing/components/SkiingHero.tsx`
- Create: `apps/brand/src/concepts/skiing/components/SkiingHero.test.tsx`
- Create: `apps/brand/public/assets/brand/skiing-poster.jpg`

**Interfaces:**

- Consumes: `useReducedMotion()`、从现有 `backgroundVideo` 提取的静态帧
- Produces: 始终可见的静态背景图、允许动态效果时才渲染的视频层、视频 `poster`

- [x] **Step 1: 写失败测试**

在现有 Skiing 首页测试中断言静态背景图存在，视频包含 poster。

```tsx
expect(screen.getByRole('img', { name: '滑雪运动员穿越雪地' })).toHaveAttribute(
  'src',
  '/assets/brand/skiing-poster.jpg',
)
expect(video).toHaveAttribute('poster', '/assets/brand/skiing-poster.jpg')
```

- [x] **Step 2: 运行定向测试确认失败**

Run: `pnpm --filter @gaoge/app-brand test -- App.test.tsx`

Expected: FAIL，当前首页没有静态背景图且视频没有 poster。

- [x] **Step 3: 实现静态图片与视频策略**

从当前背景视频提取一帧并保存为 `skiing-poster.jpg`。在 `SkiingHero` 中调用 `useReducedMotion()`，先渲染静态背景图；仅在不减少动态效果时渲染视频，并设置相同 poster。静态图使用与视频一致的绝对定位和 `object-cover`。

- [x] **Step 4: 运行定向测试**

Run: `pnpm --filter @gaoge/app-brand test -- App.test.tsx`

Expected: PASS。

### Task 4: 完整验证与关键路径检查

**Files:**

- Verify: `apps/brand/src/brand/components/BrandNavigation.tsx`
- Verify: `apps/brand/src/concepts/skiing/components/SkiingHero.tsx`
- Verify: `apps/brand/src/styles.css`
- Verify: `apps/brand/src/App.test.tsx`

**Interfaces:**

- Consumes: 前三项任务产生的最终实现
- Produces: 可交付的验证证据

- [x] **Step 1: 运行 Brand 完整测试**

Run: `pnpm --filter @gaoge/app-brand test`

Expected: 全部测试通过且无未处理警告。

- [x] **Step 2: 运行类型检查与构建**

Run: `pnpm --filter @gaoge/app-brand typecheck && pnpm --filter @gaoge/app-brand build`

Expected: 两个命令均以退出码 0 完成。

- [x] **Step 3: 运行仓库样式检查和差异检查**

Run: `pnpm lint:style && git diff --check`

Expected: Stylelint 无错误，Git 差异无空白错误。

- [x] **Step 4: 浏览器验证桌面与移动端**

在 1440×900、390×844 和 320×800 检查首页、打开、领域切换、关闭、Tab 焦点循环、触控尺寸、窄屏导航和视频 poster；确认控制台无错误。

- [x] **Step 5: 核对最终差异**

Run: `git diff --stat && git diff -- apps/brand docs/superpowers/specs/2026-08-05-brand-home-polish-design.md docs/superpowers/plans/2026-08-05-brand-home-polish.md`

Expected: 差异只包含本次首页精修、测试、设计和计划文档。

### Task 5: 首屏三个区域联动能力弹窗

**Files:**

- Modify: `apps/brand/src/App.test.tsx`
- Modify: `apps/brand/src/brand/components/BrandNavigation.tsx`
- Modify: `apps/brand/src/concepts/skiing/components/BrandSignal.tsx`
- Modify: `apps/brand/src/concepts/skiing/components/SkiingHero.tsx`
- Modify: `apps/brand/src/concepts/skiing/components/SkiingNavbar.tsx`

**Interfaces:**

- Consumes: `BrandNavigation` 现有 `openCapability(area, trigger)`、`BrandSignalProps`、首屏三个 `BrandSignal` 调用点
- Produces: `CapabilityArea`、`BrandNavigationHandle.openCapability(area, trigger)`、`BrandSignal` 按钮分支、体育/数字/内容映射

- [x] **Step 1: 写失败测试**

使用表驱动测试依次点击三个首屏按钮，确认 dialog 标题分别为体育、数字、内容，路由保持不变；关闭后焦点恢复到本次触发按钮。

```tsx
for (const [buttonName, heading] of [
  ['打开体育能力说明', '体育'],
  ['打开数字能力说明', '数字'],
  ['打开内容能力说明', '内容'],
] as const) {
  const trigger = screen.getByRole('button', { name: buttonName })
  fireEvent.click(trigger)
  expect(screen.getByRole('dialog')).toHaveAttribute('open')
  expect(
    within(screen.getByRole('dialog')).getByRole('heading', { name: heading }),
  ).toBeInTheDocument()
  expect(screen.getByTestId('location')).toHaveTextContent('/')
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '关闭能力说明' }))
  await waitFor(() => expect(trigger).toHaveFocus())
}
```

- [x] **Step 2: 运行定向测试确认失败**

Run: `pnpm --filter @gaoge/app-brand test -- App.test.tsx`

Expected: FAIL，当前三个 `BrandSignal` 是普通展示容器，没有可访问按钮或弹窗打开行为。

- [x] **Step 3: 暴露受限的弹窗打开 API**

从 `BrandNavigation` 导出 `CapabilityArea` 和 `BrandNavigationHandle`。使用 `forwardRef` 与 `useImperativeHandle` 暴露 `openCapability(area: CapabilityArea, trigger: HTMLButtonElement)`，内部继续调用现有打开逻辑；`SkiingNavbar` 使用 `forwardRef` 将 handle 透传给首页。

- [x] **Step 4: 将 `BrandSignal` 改为按钮**

将 `BrandSignalProps` 收敛为 `ariaLabel`、`onClick` 和现有视觉属性，根元素改为 `button type="button"`。把内部结构改为合法的 `span`，使用 `block` 保持原布局，并保留原 active 与 focus 类。

- [x] **Step 5: 连接三个首屏按钮**

在 `SkiingHero` 创建 `useRef<BrandNavigationHandle>` 并传给 `SkiingNavbar`。三个 `BrandSignal` 的点击处理分别调用 `openCapability('sports' | 'digital' | 'content', event.currentTarget)`，无障碍名称为“打开体育能力说明”“打开数字能力说明”“打开内容能力说明”。

- [x] **Step 6: 运行测试和浏览器检查**

Run: `pnpm --filter @gaoge/app-brand test`

Expected: 全部测试通过；桌面和移动端三个按钮仍处于原位置且视觉不变，进入 Tab 顺序，点击打开正确能力内容且路由不变，关闭后恢复焦点。
