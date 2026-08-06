# Brand 首页微信视频自动播放兼容设计

## 背景

`apps/brand` 首页使用 CloudFront MP4 作为全屏动态背景。视频在桌面和普通手机浏览器可播放，但微信内置浏览器可能拒绝页面加载阶段的自动播放。现有 CDN 已确认支持 HTTPS、`video/mp4`、Range 分段请求和跨域访问，因此本次不更换在线地址，也不接入微信公众号 JS-SDK。

## 方案选择

采用原生 `<video>` 渐进增强方案：保留 `autoPlay`、`muted`、`playsInline`，在组件挂载、`WeixinJSBridgeReady`、`canplay` 和用户首次触摸页面时调用同一个安全播放函数。Android 微信额外声明 X5 同层播放属性。

不采用以下方案：

- 微信公众号 JS-SDK：视频自动播放不依赖公众号 AppID，JS-SDK 也不能绕过系统媒体策略。
- 腾讯播放器 SDK：当前只是一个无声背景 MP4，引入完整播放器会增加无必要的依赖和运行成本。
- 本地或重新编码视频：本轮明确保持现有 CloudFront 视频 URL；编码兼容性不在本次范围内。

## 组件行为

- 视频播放前同时设置 `muted` 与 `defaultMuted`。
- `play()` 返回 Promise 被拒绝时静默保留现有 poster，不产生未处理的 Promise rejection。
- 微信 Bridge 初始化完成后重新尝试播放。
- 媒体触发 `canplay` 时重新尝试播放。
- 自动播放仍被禁止时，用户第一次触摸页面便重试；监听器只执行一次。
- 增加 `webkit-playsinline`、`x5-playsinline` 和 `x5-video-player-type="h5-page"`。
- 将 `preload` 从 `metadata` 调整为 `auto`，让微信更早加载在线视频。
- 开启减少动态效果偏好时仍不渲染视频，也不注册播放重试监听器。

## 测试与验证

- 组件测试验证微信/X5 属性、预加载策略和静音属性。
- 组件测试验证挂载、Bridge 事件、`canplay` 及首次触摸都会触发播放尝试。
- 组件测试验证 reduced-motion 模式仍只显示静态海报。
- 完成后运行 Brand 的测试、typecheck 和 build。

## 成功标准

支持静音自动播放的微信环境可在页面加载或 Bridge 就绪后播放；禁止无交互自动播放的环境可在用户第一次触摸页面时开始播放；任何播放拒绝均安全降级到现有海报。
