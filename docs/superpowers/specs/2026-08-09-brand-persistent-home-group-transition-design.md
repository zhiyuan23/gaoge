# Brand 首页与集团页持久转场容器设计

日期：2026-08-09

## 背景

当前首页上滑会先移动到集团预览层，再通过 React Router 导航到 `/group`，最后由集团页首帧覆盖层与真实内容交接。预载、等待模块 Promise 和短交叉淡化已经消除了黑色 Loading，但这条链路仍包含“预览 DOM 被卸载、真实 Group DOM 被创建”的边界，因此在部分设备上仍可能感到一次轻微停顿。

本次改为让首页手势直接揭示真实 Group 页面。路由变化只更新 URL 和页面模式，不替换已经显示在屏幕上的 Group DOM，从根本上消除预览与正式页面之间的交接。

## 已确认方向

- 首页与集团页共享一个持久的路由父容器。
- 首页下方挂载真实 `GroupPage`，不再使用专门的 `GroupTransitionPreview` 模拟集团首屏。
- 上滑过程中直接移动首页层和真实 Group 层；动画完成后更新为 `/group`，Group DOM 不卸载、不重建。
- 直接访问 `/group` 时只加载集团页；首页模块、滑雪视频组件和视频资源都不请求。
- 保留 `/` 与 `/group` 两个独立 URL、浏览器历史、右上角入口和无障碍降级。

## 目标

1. 手势开始、动画完成、URL 更新和集团页滚动解锁形成一条连续画面，没有路由替换停顿。
2. 首页上滑时看到的就是最终集团页首屏，文案、背景、导航和组织图不发生二次变化。
3. 直接打开或刷新 `/group` 不加载首页 JavaScript chunk、海报和背景视频。
4. 首页初始内容优先显示；集团页在首页稳定后后台加载，不阻塞首屏视频和主要交互。
5. 保留现有手势阈值、速度投影、滚轮累计、回弹、减少动态效果和能力弹层禁用逻辑。

## 不在范围内

- 不把整个 Brand 站改为单页纵向幻灯片。
- 不合并 `/digital`、`/content` 或 Concepts 页面。
- 不把完整首页视频打入 `/group` 的首屏依赖。
- 不改变集团页内容、数据、API、权限或部署方式。
- 不增加新的路由、动画或状态管理依赖。
- 不要求浏览器返回时从集团页任意滚动位置播放整屏反向动画。

## 方案比较

### 方案 A：持久路由父容器与真实 Group 层（采用）

`/` 和 `/group` 匹配同一个无路径父 Route，父组件负责渲染首页层、真实 Group 层和手势状态。子路径变化不会卸载父组件。首页模式下 Group 页面作为固定、裁切、不可交互的第二层存在；完成动画后它原地切换成正常文档流页面。

优点是 Group DOM、图片和排版完全连续，同时可以根据首次路径决定是否加载首页。

### 方案 B：真正合并为一个长页面

首页和集团内容始终一起渲染，结构最直观，但直接访问 `/group` 也会解析首页和视频逻辑，违背性能要求。不采用。

### 方案 C：保留独立路由并继续优化覆盖层

实现成本最低，但仍然存在两棵 DOM 树及路由交接，无法彻底去掉轻微停顿。不采用。

## 路由架构

### 持久父 Route

`App.tsx` 为 `/` 和 `/group` 建立同一个 pathless parent route：

```text
Routes
└── HomeGroupRouteShell
    ├── index: /
    └── group: /group
```

父组件通过 `useLocation()` 判断当前模式，不依赖子页面 `Outlet` 来替换可见内容。数字、内容和 Concepts 路由继续使用现有独立页面结构。

### 条件模块加载

- 首次路径为 `/`：立即渲染 lazy 首页模块；首页完成首轮挂载后调用共享 `loadGroupPage()`。
- Group 模块 resolve 后才把真实集团层挂入 DOM。
- 首次路径为 `/group`：只渲染 lazy Group 模块，不渲染、不预载首页模块。
- `SkiingPage` 仍然是 lazy component；仅持有 lazy component 引用不会执行其模块，也不会创建 `<video>` 或请求视频资源。
- `/concepts/skiing` 继续独立渲染 Skiing 概念页，不启用首页到集团的持久转场容器。

自动化测试必须通过模块加载记录和 DOM 断言证明：直接 `/group` 时首页模块未执行、页面中没有 video，且网络资源属性中不出现滑雪视频 URL。

## 视觉与布局模型

### 首页模式

- 首页为固定的前景层，占据 `100dvh`。
- Group 页面是真实、完整的页面组件，但在加载完成后以固定层放在视口下方。
- Group 层使用 `transform: translate3d(0, calc(100dvh + offset), 0)`，并在手势前保持 `inert`、`aria-hidden`、`pointer-events: none`。
- Group 层在首页模式下限定为 `100dvh` 并裁切溢出，因此只揭示真实首屏，不允许提前滚动后续章节。
- 首页层与 Group 层使用同一个 MotionValue；触摸或滚轮输入时保持连续 1:1 位移。

### 完成进入

1. spring 把首页移到 `-100dvh`，真实 Group 层移动到视口原点。
2. Group 模块如果仍未准备好，则动画不开始完成段；输入可以先给出轻量加载反馈，页面不进入空白状态。
3. Group 已经挂载并到达原点后，调用 `navigate('/group')` 更新 URL。
4. pathless route shell 保持挂载，Group 组件实例保持在同一 DOM 位置。
5. 在同一个 layout commit 中把 Group 层从 fixed/transform 状态重置为正常文档流，移除 `inert` 和裁切，并把文档滚动位置设为顶部。
6. 首页层在重置后卸载或保持未渲染，视频停止并释放。

固定层到正常文档流的 rebase 必须在 `useLayoutEffect` 中完成，使 Group 元素布局位置减少一个视口高度的同时，容器 transform 回到零；两项变化在下一次绘制前完成，屏幕位置不变。

### 直接进入集团页

首次 location 为 `/group` 时不创建转场坐标系：Group 页面从第一次 render 起就是正常文档流，正常播放自身首屏入场动画。页面不渲染首页层、手势入口或视频组件，也不创建过渡用 fixed 样式。

## 组件边界

### `HomeGroupRouteShell`

新增在 Brand 路由层，职责包括：

- 判断首次路径和当前路径。
- 条件加载首页与 Group 模块。
- 持有首页、拖动、完成和 Group 文档流模式。
- 在 URL 更新前后保持 Group 组件实例稳定。
- 管理隐藏层的 `inert`、`aria-hidden`、pointer events 和滚动锁定。
- 直接 Group 访问时绕过所有首页逻辑。

### `GroupSwipeEntry`

从“内部渲染首页 + 模拟预览”的组件改为纯手势与运动控制层：

- 接收首页内容和真实 Group 内容。
- 继续复用现有距离、速度、投影、滚轮和 rubber-band 函数。
- 暴露顶部导航复用的 `enterGroup()`。
- 只有 Group 内容 ready 后才允许完成进入；未 ready 时不导航到 fallback。
- 完成回调只通知 shell 更新路由模式，不创建新的页面实例。

### `SkiingHero` / `SkiingPage`

- 移除内部 `GroupSwipeEntry` 和 Group 路由加载职责。
- 接收 `onGroupNavigate` 与 `onCapabilityOpenChange`，继续维护视频、首页内容和导航弹层。
- `/concepts/skiing` 未提供集团转场控制时，右上角普通链接仍直接进入 `/group`。

### `GroupPage`

- 移除 `GroupRouteHandoff` 和一次性 `location.state` 逻辑。
- 接受可选的 `skipHeroEntrance`，从首页真实 DOM 转入时避免二次动画；直接访问时保持原有入场。
- 页面业务内容和章节顺序不变。

### 删除的临时交接能力

持久容器稳定后删除：

- `GroupTransitionPreview`
- `GroupRouteHandoff`
- `fromHomeTransition` route state
- 对应覆盖层 CSS 和不再适用的测试

这些只用于两棵 DOM 之间的过渡，真实 Group DOM 连续后不再需要。

## 状态模型

- `home-loading-group`：首页可用，Group 模块后台加载，入口可见但不会进入空白页面。
- `home-ready`：两个真实层已挂载，允许触摸和滚轮连续揭示。
- `dragging`：首页和 Group 随 MotionValue 移动。
- `settling-home`：意图不足，从当前值回弹到首页。
- `settling-group`：意图成立，继承速度移动到 Group 原点。
- `rebasing-group`：更新 URL，并在绘制前从固定层切换到正常文档流。
- `group`：仅 Group 页面处于可访问、可滚动状态，首页视频已卸载。

重复输入继续由现有 navigation guard 防止重复提交。组件卸载时停止 spring、wheel timer 和待执行的 frame。

## 加载与失败处理

- 首页挂载后尽早预载 Group chunk，但不阻塞首页首屏。
- 在 Group 未 ready 时，底部尖头仍可显示；点击或明确上滑后将 Group 加载提升为高优先级，首页保持原位或最多停在克制的预揭示边界。
- Group 加载成功后继续用户已表达的进入意图，不要求再次操作。
- Group chunk 加载失败时回到首页位置、恢复输入，并保留右上角普通 `/group` 链接作为重试路径；不得停留在不可操作的中间帧。
- 直接 `/group` 的加载失败继续走站点现有 lazy route 错误行为，不回退加载首页视频。

## 历史、滚动与返回

- 完成手势后使用普通 push 导航到 `/group`，浏览器返回仍回到 `/`。
- URL 更新不携带一次性 transition state，因为 shell 本身知道这次实例内的转场状态。
- 进入 Group 文档流时滚动位置为 0；之后恢复正常页面滚动和 sticky 导航。
- 从 Group 深处浏览器返回首页时不强制播放整页反向移动，以免大面积内容突然位移；卸载 Group 并恢复首页顶部，可使用不超过 160ms 的短交叉淡化。
- 在 Group 首屏顶部通过明确“返回首页”行为返回时，可以后续评估对称下滑，但不纳入本次实现。

## 无障碍与减少动态效果

- 首页模式下未揭示的 Group 层必须同时设置 `inert`、`aria-hidden` 和 `pointer-events: none`，内部链接不进入 Tab 顺序。
- 拖动过程中焦点仍留在首页入口；只有完成 rebase 后 Group 页面进入可访问树。
- 首页移出后立即停止视频并卸载首页，避免后台持续播放。
- `prefers-reduced-motion: reduce` 下不挂载双层整屏手势场景：点击入口先等待 Group 模块，然后直接切换到 `/group` 的 Group 文档流。
- 直接 `/group` 的可访问语义与当前页面保持一致。

## 测试与验证

### 自动化测试

1. 直接 `/group` 只执行 Group 模块，不执行 Skiing 页面模块，也不渲染 video。
2. 首页先渲染，Group 模块 resolve 后挂载真实 Group 标题、导航和组织图作为隐藏第二层。
3. 隐藏 Group 层具有 `inert`、`aria-hidden` 和不可点击状态。
4. 上拖时首页与真实 Group 层使用同一个连续 MotionValue。
5. Group 未 ready 时不会更新 URL；ready 后继续一次已确认的进入意图。
6. 完成动画后 URL 为 `/group`，Group 根 DOM 节点引用与动画期间相同。
7. rebase 后 Group 层进入正常文档流、可滚动且首页 video 被卸载。
8. 短拖、向下拖、快速甩动、滚轮累计、能力弹层禁用和重复导航测试继续通过。
9. Group 加载失败会回弹并恢复入口，不停留在中间状态。
10. 减少动态效果下不执行双层整屏位移，直接访问 Group 仍不加载首页。

### 浏览器检查

- 1440×900：慢拖、快速上甩、点击入口、滚轮和顶部集团入口。
- 网络节流：Group chunk 未完成时首页不黑屏，完成后自动继续进入。
- 逐帧检查：Group 首屏从被揭示到 URL 更新后，背景、导航、标题和组织图像素位置不变。
- 390×844、320×800：真实 Group 层揭示时无横向溢出，尖头与能力信号不重叠。
- 844×390 粗指针横屏：底部提示隐藏，顶部集团链接可用。
- 直接 `/group`：Network 面板无滑雪视频、poster 和 Skiing chunk 请求。
- 刷新、后退、前进：URL、滚动位置、视频生命周期和可访问状态正确。
- 控制台无 React、路由、资源或 hydration 警告。

## 成功标准

- 首页上滑过程中出现的 Group DOM 与完成后的 Group DOM 是同一个节点实例。
- URL 更新前后没有 Loading、覆盖层淡出、亮度闪烁或排版重建。
- 慢网只可能延长首页或预揭示状态，不出现空白集团页。
- 直接 `/group` 不请求首页视频及其海报，不执行首页组件模块。
- Group 完成进入后恢复正常文档滚动，首页视频停止且节点被卸载。
- 现有手势、点击、键盘、弹层禁用、移动端和减少动态效果行为保持可用。

## 对现有设计的关系

本文替代 `2026-08-09-brand-group-transition-polish-design.md` 中“预载 + GroupRouteHandoff 覆盖层”的最终交接实现。前一版的手势物理、轻量尖头、移动端策略和减少动态效果原则继续有效；仅路由交接架构改为持久真实 DOM。
