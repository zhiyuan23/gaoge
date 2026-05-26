# Gaoge iOS 应用接入与首版界面骨架设计

日期：2026-05-26

## 目标

在当前 monorepo 的 `apps/` 下新增一个独立的 iOS 原生应用 `apps/ios`，工程名为 `GaogeIOS`，并满足以下前提：

- 应用目录位于 `apps/ios`
- 工程本身独立运行、独立构建、独立调试
- UI 采用 `SwiftUI`
- 首版使用最通用、最现代的原生写法与目录结构
- 页面风格参考 Apple 健身 App 的信息密度和视觉气质
- 底部三个导航在 `iOS 26` 上使用 Liquid Glass 效果，在较低系统版本自动回退
- 首版使用本地假数据与轻量状态流，不接真实接口

本次设计的重点不是实现完整业务，而是先把 iOS 应用在当前 monorepo 中的接入方式、工程边界、目录组织、页面骨架、状态模型和系统版本策略定清楚。

## 背景

当前仓库已经具备以下基础：

- `apps/admin`、`apps/web`、`apps/miniapp`、`apps/api`、`apps/desktop` 已经存在并按真实应用维护
- 根目录通过 `pnpm-workspace.yaml` 与 `turbo.json` 管理 JavaScript/TypeScript 应用与共享包
- `apps/*` 的职责已经明确：每个应用独立运行、独立构建、独立部署
- 仓库协作规范要求新增真实应用时同步更新 `AGENTS.md`

这意味着新的 iOS 端应该被视为一个新的真实应用入口，而不是把现有 Web 或 Desktop 项目包装成 iOS 壳，也不应该为了统一 Node 工具链而牺牲原生工程的自然形态。

## 范围

包含：

- 在 `apps/ios` 下定义独立 iOS 原生工程结构
- 创建首版 `GaogeIOS` SwiftUI 工程
- 搭建三栏 Tab 应用骨架
- 实现健身风格的首页、训练页、个人页
- 用本地假数据驱动页面内容和轻量交互状态
- 在 `iOS 26` 上为底部导航提供 Liquid Glass 效果
- 为较低系统版本提供一致的原生回退样式
- 补充必要的仓库脚本、文档和协作说明

不包含：

- 现在就接入 `apps/api`
- 现在就接入登录、账号、持久化、HealthKit、推送
- 首版就支持 Widget、Watch、Live Activity
- 现在就拆分独立 Swift Package
- 现在就引入重状态管理框架或复杂架构模板

## 方案选择

本次评估过三种路线：

### 方案 A：轻量原生工程

路线：

- 使用标准 `Xcode` 原生工程
- 界面使用 `SwiftUI`
- 状态使用 `Observation` 与局部 `@State`
- 目录按 `App / Core / Features / Shared / Resources` 组织

优点：

- 最符合当前“最通用、最现代”的目标
- 首版维护成本最低
- 容易和 Apple 平台能力自然对齐
- 后续要扩展业务时不需要推翻基础结构

缺点：

- 边界约束依赖目录纪律而不是编译期模块边界
- 首版模块化强度不如 Package 化方案

### 方案 B：首版即本地模块化

路线：

- 除主 App 外，把 `Core`、`Shared`、`Features` 拆成本地 Swift Package
- 用包依赖替代目录约束

优点：

- 编译期边界更清晰
- 更利于长期大型团队协作

缺点：

- 首版明显过重
- Xcode 配置与依赖管理成本更高
- 当前只有一个 iOS 应用时收益不足

### 方案 C：额外引入工程生成器

路线：

- 使用 `Tuist` 或 `XcodeGen` 管理工程文件
- 叠加模块化结构

优点：

- 多 target、多模块场景下更规整
- 工程配置更容易模板化

缺点：

- 会给当前 monorepo 再引入一层新工具链
- 对本次目标没有直接必要性

### 最终结论

确认采用方案 A，也就是：

- `apps/ios` 下维护标准原生 `Xcode` 工程
- UI 使用 `SwiftUI`
- 状态流采用 `Observation + @State + 显式注入`
- 目录采用 feature-based 组织，但首版不拆 Swift Package
- 保持轻量、现代、可演进，不做过度工程化

这是当前阶段最稳妥、最不容易返工的路线。

## 技术栈

确认采用以下技术栈：

- 开发语言：`Swift`
- UI 框架：`SwiftUI`
- 状态模型：`Observation`
- 工程管理：`Xcode` 原生工程
- 构建与运行：`xcodebuild` + Xcode / Simulator
- 测试：`XCTest`

不采用以下路线：

- 首版不引入 `TCA`
- 首版不引入 `MVVM + Coordinator` 全量模板
- 首版不引入第三方网络库
- 首版不引入本地数据库
- 首版不引入 Swift Package 模块化

原因如下：

- `SwiftUI + Observation` 已经能覆盖当前页面骨架和轻量状态的需求
- 首版核心目标是把独立应用稳稳接进 monorepo，而不是先把架构复杂度做满
- 保留目录边界已经足够支撑后续逐步接业务和抽共享能力

## 应用定位

`apps/ios` 是高歌体系中的独立 iOS 客户端入口，但首版是通用健身风格演示工程，而不是正式业务产品实现。

它的职责是：

- 作为新的 iOS 应用入口落地到当前 monorepo
- 提供现代 SwiftUI 应用壳与目录基线
- 提供三栏 Tab 的高保真界面骨架
- 用本地假数据演示页面内容组织和交互状态
- 作为后续接真实业务、接口和设备能力的起点

它不承担以下职责：

- 不作为现有 Web 项目的套壳
- 不在首版接入业务后端
- 不承担共享包沉淀容器角色
- 不在首版实现复杂账号和数据同步体系

## 目录设计

建议 `apps/ios` 采用如下目录：

```text
apps/ios/
  README.md
  GaogeIOS.xcodeproj

  GaogeIOS/
    App/
      GaogeIOSApp.swift
      AppModel.swift
      RootTabView.swift

    Core/
      Models/
        ActivitySummary.swift
        WorkoutItem.swift
        ProfileSummary.swift
      Repositories/
        MockDashboardRepository.swift
      Styling/
        AppTheme.swift

    Features/
      Home/
        HomeView.swift
        HomeFeatureModel.swift
      Workouts/
        WorkoutsView.swift
        WorkoutsFeatureModel.swift
      Profile/
        ProfileView.swift

    Shared/
      Components/
        GlassTabBar.swift
        MetricRingCard.swift
        SectionHeader.swift
        WorkoutCard.swift
        ProfileStatCard.swift

    Resources/
      Assets.xcassets
      Preview Content/
        Preview Assets.xcassets
```

目录职责如下：

- `App`
  放应用入口、根容器和应用级依赖装配
- `Core`
  放与具体页面解耦的模型、假数据仓库、主题能力
- `Features`
  按页面或业务功能组织实现
- `Shared`
  放跨页面复用的 UI 组件
- `Resources`
  放资源与预览素材

这个结构的核心目标是让每个目录有清晰职责，同时保留足够低的上手成本。

## 页面与信息架构

首版采用三栏底部导航：

- 首页 `Home`
- 训练页 `Workouts`
- 个人页 `Profile`

整体视觉方向参考 Apple 健身 App，但不直接复制其品牌表达或业务语义。页面需要具备以下特征：

- 信息组织紧凑但不拥挤
- 大卡片 + 指标块 + 轻量列表的混合排版
- 偏浅色、偏自然绿色系运动风格
- 明确的层级与较强的完成度

### 首页 `Home`

首页承担“今日概览”职责，建议包含：

- 顶部问候区：日期、欢迎语、个人摘要
- 指标总览区：三组运动进度或健康活动指标
- 今日重点卡片：推荐训练、恢复建议、连续打卡等
- 最近活动区：横向或纵向的近期训练记录
- 趋势摘要区：本周训练次数、总时长、能量趋势等

首页重点是建立产品气质和“今日看板”感。

### 训练页 `Workouts`

训练页承担“浏览与选择训练内容”职责，建议包含：

- 顶部分类切换：力量、有氧、恢复
- 今日计划卡：当前推荐主训练
- 快速筛选 chips：短时、高强度、居家、无器械
- 训练列表区：展示多个训练卡片
- 最近完成区：展示已完成训练

训练页重点不是做完整课程系统，而是把浏览、筛选和选择关系先做清楚。

### 个人页 `Profile`

个人页承担“个人概览与偏好入口”职责，建议包含：

- 用户头部卡：头像、昵称、连续训练天数等摘要
- 本周目标区：训练目标与活跃分钟目标
- 成就区：徽章与 milestone
- 偏好设置入口：通知、主题、健康数据等占位
- 关于区：版本与反馈入口占位

个人页首版不实现真实账号逻辑，但要保留后续接入空间。

## 状态模型与数据来源

首版采用轻量状态模型，不建立全局大 store。

状态边界如下：

- `AppModel`
  放当前选中 Tab、主题偏好、共享 mock 仓库引用
- `HomeFeatureModel`
  放首页展示数据和轻量选中态
- `WorkoutsFeatureModel`
  放分类、筛选、训练项选中态
- `Profile` 页面
  以静态或轻量本地状态为主，不额外引入复杂模型

数据来源如下：

- 所有首页、训练页、个人页数据来自 `MockDashboardRepository`
- 数据模型只覆盖当前页面所需字段
- 不预先为未来接口设计过宽泛的抽象协议

状态设计原则如下：

- 页面内状态优先局部化
- 引用状态只在确有共享需求时提升到 `AppModel`
- 依赖优先通过 initializer 显式传入
- 少量真正全局能力再考虑 `@Environment`

## Liquid Glass 与系统版本策略

底部导航需要在 `iOS 26` 上使用 Liquid Glass 效果，同时在较低系统保持一致交互结构。

### 组件设计

不直接依赖系统默认 `TabView` 外观，而是采用自定义底部导航组件：

- `RootTabView` 负责页面切换
- `GlassTabBar` 负责底部导航容器
- `TabBarItemView` 负责单个 Tab 的图标、标题和激活态

这样可以统一控制视觉、间距、交互和回退策略。

### iOS 26 实现策略

在 `iOS 26` 上采用原生 Liquid Glass API，约束如下：

- 多个玻璃元素使用 `GlassEffectContainer` 组织
- 底部导航整体胶囊使用 `.glassEffect(...)`
- 激活项使用更高 prominence 的玻璃高亮
- 只在真实交互元素上使用 `interactive()`
- `glassEffect` modifier 放在布局与基础视觉修饰之后

目标视觉效果：

- 整个 Tab Bar 是一整块半透明流体胶囊
- 当前激活项在内部形成更实、更亮的玻璃 pill
- 非激活项保持轻量 icon + 文案层级

### 低版本回退策略

采用统一结构、只降级材质的策略：

- `if #available(iOS 26, *)` 使用 Liquid Glass
- 否则使用 `.ultraThinMaterial` 或 `.regularMaterial`
- 布局、点击区、文本、图标、状态切换逻辑保持一致
- 不维护两套导航结构

这个策略可以最大程度减少后续维护分叉。

## 仓库接入方式

`apps/ios` 作为 monorepo 内的独立应用存在，但不强行并入当前 JavaScript 构建链。

原则如下：

- 目录归属仍然是 `apps/*`
- 实际构建入口以 Xcode / `xcodebuild` 为主
- 不要求 `turbo` 负责编译 Swift 工程
- 不为了“统一”而伪造 npm-only 的 iOS 开发流程

这样更符合原生项目的自然边界，也不会给现有 `pnpm`、`turbo` 工作流增加不必要负担。

## 根脚本与文档补充

为了保持仓库入口一致性，根目录只补最必要的代理脚本：

- `dev:ios`
  统一说明或调起 iOS 开发入口
- `build:ios`
  使用 `xcodebuild` 做 simulator 构建校验
- `typecheck:ios`
  使用 `xcodebuild` 编译校验替代独立类型检查

同时需要同步更新：

- `AGENTS.md`
  增加 `apps/ios` 为真实应用，补充常用命令与职责说明
- `apps/ios/README.md`
  说明最低系统版本、目录职责、如何运行与构建

新增真实应用时同步更新这些文档，符合当前仓库协作约束。

## 验证策略

首版完成后至少应满足以下验证结果：

- `GaogeIOS.xcodeproj` 能正常打开
- 应用能在 iOS Simulator 上编译运行
- 三个 Tab 能正常切换
- 页面由本地假数据驱动，不出现空白骨架
- `iOS 26` 环境下底部导航使用 Liquid Glass
- 非 `iOS 26` 环境下自动回退为 material 风格

测试上保持克制：

- 可以补 1 到 2 个轻量 `XCTest`
- 优先覆盖 mock repository 或 feature model
- 不为了“有测试”而在首版引入大量 snapshot 测试

## 明确不做的内容

为了保证首版目标清晰，本次明确排除以下内容：

- `apps/api` 接入
- HealthKit
- 真实登录
- 本地持久化
- Widget
- Watch
- Live Activity
- 深链
- 多主题系统

这些能力都可以在后续基于本次应用骨架逐步演进，但不纳入本轮实现范围。

## 最终结论

本次确认在 `apps/ios` 下新增独立原生应用 `GaogeIOS`，采用：

- 标准 Xcode 原生工程
- `SwiftUI + Observation`
- `App / Core / Features / Shared / Resources` 目录结构
- 三栏 Tab 信息架构
- 健身风格高保真页面骨架
- 本地假数据驱动
- `iOS 26` Liquid Glass 增强 + 低版本 Material 回退

这套方案能在当前 monorepo 中最小成本地落下一个现代 iOS 应用起点，并为后续真实业务接入保留足够清晰的扩展路径。
