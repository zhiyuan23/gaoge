# Brand 首页上滑进入集团页 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 Brand 单屏首页增加可见、可点击、可拖动的“上滑了解高歌集团”入口，并以可取消的连续转场进入 `/group`。

**Architecture:** 使用首页私有的 `GroupSwipeEntry` 包裹现有 Hero 与轻量集团预览层；手势与滚轮只更新 Framer Motion `MotionValue`，完成后由 `SkiingHero` 统一执行 React Router 导航。手势判定提取为纯函数，顶部集团链接复用同一转场入口，能力弹层打开时暂停背景转场。

**Tech Stack:** React 18、TypeScript、React Router 6、Framer Motion 12、Tailwind CSS、Vitest、Testing Library

## Global Constraints

- 保留右上角“高歌集团”链接，底部手势不是唯一入口。
- 仅从底部入口开始 Pointer 拖动，不接管整张首页。
- 不引入依赖、全局状态、全站 scroll-snap 或集团页滚动劫持。
- 逐帧变化只使用 `transform` 和 `opacity`。
- `prefers-reduced-motion: reduce` 下不执行拖动、滚轮位移或整屏 spring。
- 保持首页视频、主标题、四个能力入口和集团页内容结构不变。
- 320px 及以上不得产生横向溢出。

---

## File Map

- Create `apps/brand/src/concepts/skiing/groupTransition.ts`: 纯手势投影、阈值与橡皮筋计算。
- Create `apps/brand/src/concepts/skiing/groupTransition.test.ts`: 覆盖位移、速度、投影和边界行为。
- Create `apps/brand/src/concepts/skiing/components/GroupTransitionPreview.tsx`: 不可交互的集团首屏预览。
- Create `apps/brand/src/concepts/skiing/components/GroupSwipeEntry.tsx`: 底部入口、Pointer/滚轮输入、MotionValue 与完成/回弹状态。
- Create `apps/brand/src/concepts/skiing/components/GroupSwipeEntry.test.tsx`: 入口语义、点击、拖动、滚轮、禁用和减少动态效果测试。
- Modify `apps/brand/src/concepts/skiing/components/SkiingHero.tsx`: 用转场组件包裹首页并统一导航。
- Modify `apps/brand/src/concepts/skiing/components/SkiingNavbar.tsx`: 透传集团导航和弹层状态回调。
- Modify `apps/brand/src/brand/components/BrandNavigation.tsx`: 允许首页拦截集团链接，并上报能力弹层打开状态。
- Modify `apps/brand/src/concepts/skiing/components/SkiingHero.test.tsx`: 覆盖底部入口和导航协作。
- Modify `apps/brand/src/App.test.tsx`: 覆盖首页集团入口的最终路由行为。
- Modify `apps/brand/src/styles.css`: 补充底部入口、预览材质和响应式/减少动态效果样式。

---

### Task 1: 手势判定纯函数

**Files:**

- Create: `apps/brand/src/concepts/skiing/groupTransition.ts`
- Test: `apps/brand/src/concepts/skiing/groupTransition.test.ts`

**Interfaces:**

- Produces: `rubberband(distance, dimension, constant?) => number`
- Produces: `projectTravel(distance, velocity, decelerationRate?) => number`
- Produces: `shouldEnterGroup({ distance, velocity, viewportHeight }) => boolean`
- Produces: `getWheelCommitDistance(viewportHeight) => number`

- [ ] **Step 1: Write focused unit tests**

```ts
import { describe, expect, it } from 'vitest'

import {
  getWheelCommitDistance,
  projectTravel,
  rubberband,
  shouldEnterGroup,
} from '@/concepts/skiing/groupTransition'

describe('group transition physics', () => {
  it('commits after dragging 28% of the viewport', () => {
    expect(shouldEnterGroup({ distance: 237, velocity: 0, viewportHeight: 844 })).toBe(true)
    expect(shouldEnterGroup({ distance: 120, velocity: 0, viewportHeight: 844 })).toBe(false)
  })

  it('commits a fast upward flick only when its projection shows intent', () => {
    expect(shouldEnterGroup({ distance: 90, velocity: 1_200, viewportHeight: 844 })).toBe(true)
    expect(shouldEnterGroup({ distance: 20, velocity: 1_200, viewportHeight: 844 })).toBe(false)
  })

  it('projects momentum and resists downward overscroll', () => {
    expect(projectTravel(80, 1_000)).toBeGreaterThan(80)
    expect(rubberband(120, 844)).toBeGreaterThan(0)
    expect(rubberband(120, 844)).toBeLessThan(120)
  })

  it('requires accumulated wheel intent', () => {
    expect(getWheelCommitDistance(844)).toBeGreaterThan(100)
    expect(getWheelCommitDistance(844)).toBeLessThanOrEqual(180)
  })
})
```

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `pnpm --filter @gaoge/app-brand test -- src/concepts/skiing/groupTransition.test.ts`

Expected: FAIL because `groupTransition.ts` does not exist.

- [ ] **Step 3: Implement deterministic physics helpers**

```ts
const DRAG_COMMIT_RATIO = 0.28
const FLICK_PROJECTION_RATIO = 0.16
const MIN_FLING_VELOCITY = 900

export function rubberband(distance: number, dimension: number, constant = 0.55) {
  return (distance * dimension * constant) / (dimension + constant * Math.abs(distance))
}

export function projectTravel(distance: number, velocity: number, decelerationRate = 0.99) {
  return distance + (velocity / 1000) * (decelerationRate / (1 - decelerationRate))
}

export function shouldEnterGroup(input: {
  readonly distance: number
  readonly velocity: number
  readonly viewportHeight: number
}) {
  const { distance, velocity, viewportHeight } = input
  if (distance >= viewportHeight * DRAG_COMMIT_RATIO) return true
  return (
    distance >= viewportHeight * 0.08 &&
    velocity >= MIN_FLING_VELOCITY &&
    projectTravel(distance, velocity) >= viewportHeight * FLICK_PROJECTION_RATIO
  )
}

export function getWheelCommitDistance(viewportHeight: number) {
  return Math.min(180, viewportHeight * 0.2)
}
```

- [ ] **Step 4: Run the focused test and typecheck**

Run: `pnpm --filter @gaoge/app-brand test -- src/concepts/skiing/groupTransition.test.ts`

Expected: PASS.

Run: `pnpm --filter @gaoge/app-brand typecheck`

Expected: PASS.

### Task 2: 可访问入口与连续转场组件

**Files:**

- Create: `apps/brand/src/concepts/skiing/components/GroupTransitionPreview.tsx`
- Create: `apps/brand/src/concepts/skiing/components/GroupSwipeEntry.tsx`
- Create: `apps/brand/src/concepts/skiing/components/GroupSwipeEntry.test.tsx`

**Interfaces:**

- Consumes: Task 1 的四个纯函数。
- Produces: `GroupSwipeEntryHandle.enterGroup(): void`
- Produces: `GroupSwipeEntryProps { children, disabled, onComplete }`

- [ ] **Step 1: Write component behavior tests**

测试使用 `MemoryRouter` 和立即完成的 Framer Motion `animate` mock，覆盖：

```tsx
expect(screen.getByRole('button', { name: '上滑了解高歌集团' })).toBeInTheDocument()
fireEvent.click(screen.getByRole('button', { name: '上滑了解高歌集团' }))
expect(onComplete).toHaveBeenCalledTimes(1)

fireEvent.pointerDown(entry, { clientY: 700, pointerId: 1 })
fireEvent.pointerMove(entry, { clientY: 420, pointerId: 1 })
fireEvent.pointerUp(entry, { clientY: 420, pointerId: 1 })
expect(onComplete).toHaveBeenCalledTimes(1)

fireEvent.wheel(window, { deltaY: 40 })
expect(onComplete).not.toHaveBeenCalled()
fireEvent.wheel(window, { deltaY: 180 })
expect(onComplete).toHaveBeenCalledTimes(1)
```

另行断言 `disabled` 和 reduced motion 状态下不响应背景 Pointer/滚轮，reduced motion 点击仍直接调用 `onComplete`。

- [ ] **Step 2: Run the component test and confirm failure**

Run: `pnpm --filter @gaoge/app-brand test -- src/concepts/skiing/components/GroupSwipeEntry.test.tsx`

Expected: FAIL because the components do not exist.

- [ ] **Step 3: Implement the preview scene**

`GroupTransitionPreview` 使用 `/assets/brand/group-architecture.webp`、集团页现有冷黑/鼠尾草绿语汇，以及 `GAOGE GROUP`、`连接热爱，奔赴所爱。` 两层文字。根元素设置 `aria-hidden="true"`，内部不渲染链接、按钮、导航或完整组织图。

- [ ] **Step 4: Implement `GroupSwipeEntry` state and input flow**

核心结构：

```tsx
export interface GroupSwipeEntryHandle {
  enterGroup(): void
}

interface GroupSwipeEntryProps {
  readonly children: ReactNode
  readonly disabled: boolean
  readonly onComplete: () => void
}

const offsetY = useMotionValue(0)

return (
  <div className="group-swipe-viewport relative h-[100dvh] overflow-hidden">
    <motion.div className="group-swipe-track" style={{ y: offsetY }}>
      <div className="group-swipe-home relative h-[100dvh]">
        {children}
        {entryButton}
      </div>
      <GroupTransitionPreview />
    </motion.div>
  </div>
)
```

Pointer 输入仅绑定底部按钮；用最近若干 `{y, time}` 记录计算松手速度。上移设置负 `offsetY`，向下越界使用 `rubberband`。滚轮监听使用 `{ passive: false }`，只在根首页、非交互目标、`disabled === false` 且未请求减少动态效果时累积正 `deltaY`。

完成动画从当前 MotionValue 继续到 `-window.innerHeight`；点击使用 `bounce: 0`，甩动使用不超过 `0.15` 的轻动量。回弹到 `0` 使用 `bounce: 0`。动画 Promise 完成后只调用一次 `onComplete`。

滚轮输入停止后的短计时器只用于判断输入结束并回弹，不作为输入锁；组件卸载时清理监听器、计时器和运行中的动画。

- [ ] **Step 5: Run component and physics tests**

Run: `pnpm --filter @gaoge/app-brand test -- src/concepts/skiing/groupTransition.test.ts src/concepts/skiing/components/GroupSwipeEntry.test.tsx`

Expected: PASS.

### Task 3: 接入首页导航与能力弹层状态

**Files:**

- Modify: `apps/brand/src/brand/components/BrandNavigation.tsx`
- Modify: `apps/brand/src/concepts/skiing/components/SkiingNavbar.tsx`
- Modify: `apps/brand/src/concepts/skiing/components/SkiingHero.tsx`
- Modify: `apps/brand/src/concepts/skiing/components/SkiingHero.test.tsx`
- Modify: `apps/brand/src/App.test.tsx`

**Interfaces:**

- Consumes: `GroupSwipeEntryHandle.enterGroup()` and `GroupSwipeEntry`.
- Produces: `BrandNavigationProps.onGroupNavigate?: () => void`
- Produces: `BrandNavigationProps.onCapabilityOpenChange?: (open: boolean) => void`

- [ ] **Step 1: Add failing integration assertions**

在 `SkiingHero.test.tsx` 断言底部按钮存在，能力弹层打开后转场入口仍可见但背景滚轮不导航。在 `App.test.tsx` 点击“上滑了解高歌集团”，等待 location 变为 `/group` 并出现 `GAOGE GROUP`。

- [ ] **Step 2: Run focused integration tests and confirm failure**

Run: `pnpm --filter @gaoge/app-brand test -- src/concepts/skiing/components/SkiingHero.test.tsx src/App.test.tsx`

Expected: FAIL because the homepage has no bottom group entry.

- [ ] **Step 3: Extend navigation callbacks without weakening the link fallback**

`BrandNavigation` 在首页集团 `Link` 上保留 `to="/group"`。存在 `onGroupNavigate` 时，点击处理器 `preventDefault()` 并调用回调；未提供时维持普通 React Router 导航。用 `useEffect` 在 `isDialogOpen` 改变时调用 `onCapabilityOpenChange?.(isDialogOpen)`，卸载时上报 `false`。

`SkiingNavbar` 只透传这两个可选回调和现有 ref。

- [ ] **Step 4: Wrap the existing hero with the transition component**

`SkiingHero`：

```tsx
const navigate = useNavigate()
const transitionRef = useRef<GroupSwipeEntryHandle>(null)
const [isCapabilityOpen, setIsCapabilityOpen] = useState(false)

<GroupSwipeEntry
  disabled={isCapabilityOpen}
  onComplete={() => navigate('/group', { state: { fromHomeTransition: true } })}
  ref={transitionRef}
>
  <section>{/* unchanged poster, video, title, copy and signals */}</section>
</GroupSwipeEntry>
```

顶部集团链接调用 `transitionRef.current?.enterGroup()`；能力弹层状态通过 `setIsCapabilityOpen` 传给转场组件。除容器层级所需调整外，不修改现有 Hero 内容和位置。

- [ ] **Step 5: Run integration and complete Brand tests**

Run: `pnpm --filter @gaoge/app-brand test -- src/concepts/skiing/components/SkiingHero.test.tsx src/App.test.tsx`

Expected: PASS.

Run: `pnpm --filter @gaoge/app-brand test`

Expected: PASS.

### Task 4: 样式、系统偏好与最终验证

**Files:**

- Modify: `apps/brand/src/styles.css`
- Modify: `apps/brand/src/concepts/skiing/components/GroupSwipeEntry.test.tsx`

**Interfaces:**

- Consumes: Tasks 2–3 的稳定类名与 DOM 结构。
- Produces: 完整桌面/移动/减少动态效果视觉表现。

- [ ] **Step 1: Add focused transition styles**

在 `styles.css` 增加：

```css
.group-swipe-track {
  height: 200dvh;
  will-change: transform;
}

.group-swipe-entry {
  touch-action: none;
}

@media (prefers-reduced-motion: reduce) {
  .group-swipe-track {
    transform: none !important;
  }
}
```

同时为底部入口增加安全区间距、键盘焦点、一次性淡入，为集团预览增加与 `/group` 首屏一致的背景遮罩。320px 下收紧文案与宽度，横屏矮视口中把入口放到不会覆盖主要按钮的位置。

- [ ] **Step 2: Run formatting and static checks**

Run: `pnpm exec prettier --write apps/brand/src`

Run: `pnpm exec eslint apps/brand/src`

Run: `pnpm exec stylelint "apps/brand/src/**/*.css"`

Run: `pnpm --filter @gaoge/app-brand typecheck`

Expected: all PASS.

- [ ] **Step 3: Run full Brand verification**

Run: `pnpm --filter @gaoge/app-brand test`

Run: `pnpm --filter @gaoge/app-brand build`

Expected: all PASS.

- [ ] **Step 4: Manual browser verification**

启动 `pnpm dev:brand`，检查：

- 1440×900：底部入口点击、滚轮小幅回弹、累积滚轮进入、顶部链接进入。
- 390×844：从入口慢拖回弹、超过阈值进入、快速上甩进入，左右能力入口不重叠。
- 320×800：顶部与底部无拥挤、无横向溢出。
- 能力弹层打开时：滚轮和入口拖动均不触发集团导航。
- 减少动态效果：入口保留，点击直接进入，无整屏滑动。
- 浏览器 Back、直接打开 `/group`：路由、首屏和控制台状态正确。

- [ ] **Step 5: Review knowledge impact and repository diff**

调用知识库 `impact_for_changes`，输入本计划实际变更路径。若仅命中 Brand 项目实现而没有稳定跨仓库规则变化，记录“无需 kb-maintainer”；如命中现有 Brand 微信 H5 或导航工作流且源码事实已变化，单独提出知识维护建议，不在本任务中擅自写知识库。

Run: `git diff --check`

Run: `git status --short`

Expected: 只有本功能、计划文档和用户已有的 `.workbuddy/` 未跟踪目录；无空白错误。
