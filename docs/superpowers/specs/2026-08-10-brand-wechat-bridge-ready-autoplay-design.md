# Brand 首页微信 Bridge 提前就绪自动播放修复设计

## 背景与根因

`apps/brand` 首页已经在组件挂载、`WeixinJSBridgeReady`、`canplay` 和首次触摸时尝试播放背景视频。线上代码与当前源码一致，视频资源正常返回 `video/mp4` 并支持 Range 请求。

微信内置浏览器可能在 React 懒加载首页组件之前完成原生 Bridge 初始化。此时组件注册的 `WeixinJSBridgeReady` 监听器不会收到已经发生的事件；普通挂载和 `canplay` 回调中的 `play()` 仍可能受自动播放策略限制，最终只能等待首次 `touchstart`，表现为点击页面后才播放。

## 方案

保留现有原生 `<video>` 和所有降级逻辑，增加 Bridge 当前状态处理：

- 组件挂载时若 `window.WeixinJSBridge` 已存在，通过 Bridge 的 `getNetworkType` 回调再次尝试播放。
- Bridge 尚未就绪时继续监听 `WeixinJSBridgeReady`；事件触发后走同一 Bridge 回调播放路径。
- Bridge 对象缺失或调用异常时安全回退到普通播放尝试。
- 保留挂载、`canplay`、首次触摸、poster 和 reduced-motion 行为。
- 不引入微信 JS-SDK、公众号配置、第三方播放器或新依赖，不修改视频 URL。

相比在 `index.html` 中增加全局启动脚本，本方案将播放生命周期继续封装在 `SkiingHero` 内，避免跨组件状态和额外清理。相比完整播放器 SDK，本方案改动和运行成本更小。

## 测试与成功标准

- 新增组件测试模拟 `window.WeixinJSBridge` 在组件挂载前已经存在。
- 验证组件调用 Bridge，并在 Bridge 回调中触发播放尝试。
- 保持原有 Bridge 事件、`canplay`、首次触摸和 reduced-motion 测试通过。
- 运行 Brand focused test、全量测试、typecheck 和 build。

成功标准：微信 Bridge 早于 React 组件就绪时，无需首次点击也能获得一次 Bridge 回调上下文中的播放重试；平台仍明确禁止自动播放时，继续安全降级到首次触摸播放和静态海报。
