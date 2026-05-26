# GaogeIOS

- 工程位置：`apps/ios/GaogeIOS.xcodeproj`
- 源码目录：`apps/ios/Sources`
- 测试目录：`apps/ios/Tests`
- 最低系统版本：`iOS 18.0`
- 构建命令：`pnpm build:ios`
- 类型校验命令：`pnpm typecheck:ios`
- 设计目标：`iOS 26` 上启用 Liquid Glass 底部导航，低版本回退 Material 风格
- 当前说明：本地 Xcode 16.2 / iOS 18.2 SDK 尚不包含 `glassEffect`，`GlassTabBar` 先以 Material 风格占位
