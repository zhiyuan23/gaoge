# Gaoge iOS Bootstrap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在当前 monorepo 中新增 `apps/ios` 原生应用，落地 `GaogeIOS` 的 Xcode 工程、SwiftUI 三栏 Tab 骨架、本地假数据、iOS 26 Liquid Glass 底部导航与仓库接入脚本。

**Architecture:** `apps/ios` 作为独立应用根目录，`Sources` 负责 Swift 源码与资源，`Tests` 负责最小必要单元测试。应用使用 `SwiftUI + Observation`，数据来自本地 `MockDashboardRepository`，根壳通过自定义 `GlassTabBar` 管理三栏导航，并对 `iOS 26` 使用 Liquid Glass，对低版本回退到 Material 风格。

**Tech Stack:** Swift, SwiftUI, Observation, XCTest, Xcode project, xcodebuild, iOS Simulator

**Environment Note:** 当前 shell 需要显式使用 `DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer`。当前 `CoreSimulatorService` 返回连接错误，因此本计划把 `xcodebuild build` 与 `xcodebuild test` 作为硬验证，`simctl` 设备可见性检查作为环境恢复后的补充验证。

---

### Task 1: 创建 iOS 工程与最小可编译应用壳

**Files:**

- Create: `apps/ios/README.md`
- Create: `apps/ios/GaogeIOS.xcodeproj/project.pbxproj`
- Create: `apps/ios/GaogeIOS.xcodeproj/project.xcworkspace/contents.xcworkspacedata`
- Create: `apps/ios/GaogeIOS.xcodeproj/xcshareddata/xcschemes/GaogeIOS.xcscheme`
- Create: `apps/ios/Sources/App/GaogeIOSApp.swift`
- Create: `apps/ios/Sources/App/AppModel.swift`
- Create: `apps/ios/Sources/App/RootTabView.swift`
- Create: `apps/ios/Sources/Resources/Info.plist`
- Create: `apps/ios/Sources/Resources/Assets.xcassets/Contents.json`
- Create: `apps/ios/Sources/Resources/Preview Content/Preview Assets.xcassets/Contents.json`

- [ ] **Step 1: 先写失败的工程验证命令**

```bash
DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer \
xcodebuild \
  -project apps/ios/GaogeIOS.xcodeproj \
  -scheme GaogeIOS \
  -destination 'generic/platform=iOS Simulator' \
  build
```

- [ ] **Step 2: 运行验证命令，确认当前失败**

Run: `DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer xcodebuild -project apps/ios/GaogeIOS.xcodeproj -scheme GaogeIOS -destination 'generic/platform=iOS Simulator' build`
Expected: FAIL，因为 `apps/ios/GaogeIOS.xcodeproj` 尚不存在。

- [ ] **Step 3: 创建最小工程骨架与根壳**

```swift
// apps/ios/Sources/App/GaogeIOSApp.swift
import SwiftUI

@main
struct GaogeIOSApp: App {
  @State private var appModel = AppModel()

  var body: some Scene {
    WindowGroup {
      RootTabView(appModel: appModel)
    }
  }
}
```

```swift
// apps/ios/Sources/App/AppModel.swift
import Observation

@Observable
final class AppModel {
  enum Tab: String, CaseIterable {
    case home
    case workouts
    case profile
  }

  var selectedTab: Tab = .home
}
```

```swift
// apps/ios/Sources/App/RootTabView.swift
import SwiftUI

struct RootTabView: View {
  let appModel: AppModel

  var body: some View {
    Text(appModel.selectedTab.rawValue.capitalized)
  }
}
```

```xml
<!-- apps/ios/Sources/Resources/Info.plist -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDevelopmentRegion</key>
  <string>$(DEVELOPMENT_LANGUAGE)</string>
  <key>CFBundleExecutable</key>
  <string>$(EXECUTABLE_NAME)</string>
  <key>CFBundleIdentifier</key>
  <string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
  <key>CFBundleInfoDictionaryVersion</key>
  <string>6.0</string>
  <key>CFBundleName</key>
  <string>$(PRODUCT_NAME)</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>CFBundleShortVersionString</key>
  <string>1.0</string>
  <key>CFBundleVersion</key>
  <string>1</string>
  <key>UIApplicationSceneManifest</key>
  <dict/>
  <key>UIApplicationSupportsIndirectInputEvents</key>
  <true/>
</dict>
</plist>
```

```xml
<!-- apps/ios/GaogeIOS.xcodeproj/project.xcworkspace/contents.xcworkspacedata -->
<?xml version="1.0" encoding="UTF-8"?>
<Workspace version="1.0">
  <FileRef location="self:"/>
</Workspace>
```

```xml
<!-- apps/ios/GaogeIOS.xcodeproj/xcshareddata/xcschemes/GaogeIOS.xcscheme -->
<?xml version="1.0" encoding="UTF-8"?>
<Scheme LastUpgradeVersion="2600" version="1.7">
  <BuildAction parallelizeBuildables="YES" buildImplicitDependencies="YES">
    <BuildActionEntries>
      <BuildActionEntry buildForTesting="YES" buildForRunning="YES" buildForProfiling="YES" buildForArchiving="YES" buildForAnalyzing="YES">
        <BuildableReference BuildableIdentifier="primary" BlueprintName="GaogeIOS" ReferencedContainer="container:GaogeIOS.xcodeproj"/>
      </BuildActionEntry>
    </BuildActionEntries>
  </BuildAction>
</Scheme>
```

`project.pbxproj` 需要包含：

- 一个 iOS Application target `GaogeIOS`
- 一个 Unit Test target `GaogeIOSTests`
- `Sources` 和 `Resources` 下当前文件的 file references / build phases
- `PRODUCT_BUNDLE_IDENTIFIER = com.gaoge.GaogeIOS`
- `IPHONEOS_DEPLOYMENT_TARGET = 18.0`
- `SWIFT_VERSION = 5.0`
- `INFOPLIST_FILE = Sources/Resources/Info.plist`
- `GENERATE_INFOPLIST_FILE = NO`

- [ ] **Step 4: 重新运行工程验证，确认最小壳可编译**

Run: `DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer xcodebuild -project apps/ios/GaogeIOS.xcodeproj -scheme GaogeIOS -destination 'generic/platform=iOS Simulator' build`
Expected: PASS，生成 `Build succeeded`。

- [ ] **Step 5: 提交这一批最小工程文件**

```bash
git add apps/ios
git commit -m "feat: scaffold gaoge ios app shell"
```

### Task 2: 先写测试，再补本地模型与 mock repository

**Files:**

- Create: `apps/ios/Tests/MockDashboardRepositoryTests.swift`
- Create: `apps/ios/Tests/WorkoutsFeatureModelTests.swift`
- Create: `apps/ios/Sources/Core/Models/ActivitySummary.swift`
- Create: `apps/ios/Sources/Core/Models/WorkoutItem.swift`
- Create: `apps/ios/Sources/Core/Models/ProfileSummary.swift`
- Create: `apps/ios/Sources/Core/Repositories/MockDashboardRepository.swift`
- Create: `apps/ios/Sources/Features/Workouts/WorkoutsFeatureModel.swift`

- [ ] **Step 1: 先写失败的单元测试**

```swift
// apps/ios/Tests/MockDashboardRepositoryTests.swift
import XCTest
@testable import GaogeIOS

final class MockDashboardRepositoryTests: XCTestCase {
  func testMakeActivitySummaryProvidesThreeRings() {
    let repository = MockDashboardRepository()

    let summary = repository.makeActivitySummary()

    XCTAssertEqual(summary.rings.count, 3)
    XCTAssertEqual(summary.heroTitle, "今日概览")
  }
}
```

```swift
// apps/ios/Tests/WorkoutsFeatureModelTests.swift
import XCTest
@testable import GaogeIOS

final class WorkoutsFeatureModelTests: XCTestCase {
  func testApplyCategoryFiltersWorkouts() {
    let repository = MockDashboardRepository()
    let model = WorkoutsFeatureModel(repository: repository)

    model.selectCategory(.strength)

    XCTAssertTrue(model.visibleWorkouts.allSatisfy { $0.category == .strength })
    XCTAssertEqual(model.selectedCategory, .strength)
  }
}
```

- [ ] **Step 2: 运行测试，确认当前失败**

Run: `DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer xcodebuild -project apps/ios/GaogeIOS.xcodeproj -scheme GaogeIOS -destination 'generic/platform=iOS Simulator' test`
Expected: FAIL，因为 `MockDashboardRepository`、`WorkoutsFeatureModel` 和相关模型尚不存在。

- [ ] **Step 3: 写最小实现让测试通过**

```swift
// apps/ios/Sources/Core/Models/ActivitySummary.swift
struct ActivitySummary {
  struct Ring {
    let title: String
    let valueText: String
    let progress: Double
  }

  let heroTitle: String
  let rings: [Ring]
}
```

```swift
// apps/ios/Sources/Core/Models/WorkoutItem.swift
struct WorkoutItem: Identifiable, Equatable {
  enum Category: String, CaseIterable {
    case strength
    case cardio
    case recovery
  }

  let id: String
  let title: String
  let subtitle: String
  let durationText: String
  let category: Category
}
```

```swift
// apps/ios/Sources/Core/Models/ProfileSummary.swift
struct ProfileSummary {
  let name: String
  let streakDays: Int
  let weeklyGoalText: String
}
```

```swift
// apps/ios/Sources/Core/Repositories/MockDashboardRepository.swift
struct MockDashboardRepository {
  func makeActivitySummary() -> ActivitySummary {
    ActivitySummary(
      heroTitle: "今日概览",
      rings: [
        .init(title: "Move", valueText: "540 / 700 KCAL", progress: 0.77),
        .init(title: "Exercise", valueText: "32 / 45 MIN", progress: 0.71),
        .init(title: "Stand", valueText: "8 / 12 HRS", progress: 0.67),
      ]
    )
  }

  func makeWorkouts() -> [WorkoutItem] {
    [
      .init(id: "strength-1", title: "力量循环", subtitle: "下肢激活", durationText: "32 分钟", category: .strength),
      .init(id: "cardio-1", title: "高效燃脂", subtitle: "HIIT", durationText: "18 分钟", category: .cardio),
      .init(id: "recovery-1", title: "恢复拉伸", subtitle: "柔韧", durationText: "12 分钟", category: .recovery),
    ]
  }

  func makeProfileSummary() -> ProfileSummary {
    ProfileSummary(name: "Avery", streakDays: 4, weeklyGoalText: "本周完成 4 / 5 次训练")
  }
}
```

```swift
// apps/ios/Sources/Features/Workouts/WorkoutsFeatureModel.swift
import Observation

@Observable
final class WorkoutsFeatureModel {
  private let repository: MockDashboardRepository
  private(set) var selectedCategory: WorkoutItem.Category = .strength
  private(set) var visibleWorkouts: [WorkoutItem] = []

  init(repository: MockDashboardRepository) {
    self.repository = repository
    visibleWorkouts = repository.makeWorkouts().filter { $0.category == selectedCategory }
  }

  func selectCategory(_ category: WorkoutItem.Category) {
    selectedCategory = category
    visibleWorkouts = repository.makeWorkouts().filter { $0.category == category }
  }
}
```

- [ ] **Step 4: 重新运行测试，确认绿灯**

Run: `DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer xcodebuild -project apps/ios/GaogeIOS.xcodeproj -scheme GaogeIOS -destination 'generic/platform=iOS Simulator' test`
Expected: PASS，`MockDashboardRepositoryTests` 与 `WorkoutsFeatureModelTests` 均通过。

- [ ] **Step 5: 提交模型和仓库实现**

```bash
git add apps/ios
git commit -m "feat: add gaoge ios mock data models"
```

### Task 3: 实现三栏页面、主题和 Glass Tab Bar

**Files:**

- Create: `apps/ios/Sources/Core/Styling/AppTheme.swift`
- Create: `apps/ios/Sources/Features/Home/HomeFeatureModel.swift`
- Create: `apps/ios/Sources/Features/Home/HomeView.swift`
- Create: `apps/ios/Sources/Features/Workouts/WorkoutsView.swift`
- Create: `apps/ios/Sources/Features/Profile/ProfileView.swift`
- Create: `apps/ios/Sources/Shared/Components/GlassTabBar.swift`
- Create: `apps/ios/Sources/Shared/Components/MetricRingCard.swift`
- Create: `apps/ios/Sources/Shared/Components/SectionHeader.swift`
- Create: `apps/ios/Sources/Shared/Components/WorkoutCard.swift`
- Create: `apps/ios/Sources/Shared/Components/ProfileStatCard.swift`
- Modify: `apps/ios/Sources/App/AppModel.swift`
- Modify: `apps/ios/Sources/App/RootTabView.swift`

- [ ] **Step 1: 先用编译失败锁定缺失的页面与组件**

```bash
DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer \
xcodebuild \
  -project apps/ios/GaogeIOS.xcodeproj \
  -scheme GaogeIOS \
  -destination 'generic/platform=iOS Simulator' \
  build
```

Expected failure trigger after you update `RootTabView`: references to `HomeView`, `WorkoutsView`, `ProfileView`, and `GlassTabBar` are undefined.

- [ ] **Step 2: 先把根导航切换到真实页面引用，再确认失败**

```swift
// apps/ios/Sources/App/RootTabView.swift
import SwiftUI

struct RootTabView: View {
  @Bindable var appModel: AppModel

  var body: some View {
    ZStack(alignment: .bottom) {
      Group {
        switch appModel.selectedTab {
        case .home:
          HomeView(model: HomeFeatureModel(repository: appModel.repository))
        case .workouts:
          WorkoutsView(model: WorkoutsFeatureModel(repository: appModel.repository))
        case .profile:
          ProfileView(profile: appModel.repository.makeProfileSummary())
        }
      }

      GlassTabBar(selectedTab: $appModel.selectedTab)
        .padding(.horizontal, 20)
        .padding(.bottom, 16)
    }
  }
}
```

Run: `DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer xcodebuild -project apps/ios/GaogeIOS.xcodeproj -scheme GaogeIOS -destination 'generic/platform=iOS Simulator' build`
Expected: FAIL，因为页面与组件还未创建。

- [ ] **Step 3: 写最小页面与共享组件实现**

```swift
// apps/ios/Sources/Core/Styling/AppTheme.swift
import SwiftUI

enum AppTheme {
  static let background = Color(red: 0.95, green: 0.97, blue: 0.95)
  static let foreground = Color(red: 0.07, green: 0.13, blue: 0.10)
  static let accent = Color(red: 0.48, green: 0.84, blue: 0.55)
  static let secondaryCard = Color.white.opacity(0.72)
}
```

```swift
// apps/ios/Sources/Features/Home/HomeFeatureModel.swift
struct HomeFeatureModel {
  let summary: ActivitySummary

  init(repository: MockDashboardRepository) {
    summary = repository.makeActivitySummary()
  }
}
```

```swift
// apps/ios/Sources/Shared/Components/GlassTabBar.swift
import SwiftUI

struct GlassTabBar: View {
  @Binding var selectedTab: AppModel.Tab

  var body: some View {
    HStack(spacing: 12) {
      ForEach(AppModel.Tab.allCases, id: \.self) { tab in
        Button {
          selectedTab = tab
        } label: {
          Text(tab.title)
            .font(.system(size: 14, weight: .semibold))
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(selectionBackground(for: tab))
        }
        .buttonStyle(.plain)
      }
    }
    .padding(8)
    .background(containerBackground)
    .clipShape(Capsule())
  }

  @ViewBuilder
  private func selectionBackground(for tab: AppModel.Tab) -> some View {
    if selectedTab == tab {
      if #available(iOS 26, *) {
        Capsule().fill(.white.opacity(0.28)).glassEffect(.regular.interactive())
      } else {
        Capsule().fill(.white.opacity(0.72))
      }
    } else {
      Capsule().fill(.clear)
    }
  }

  @ViewBuilder
  private var containerBackground: some View {
    if #available(iOS 26, *) {
      Capsule().fill(.clear).glassEffect(.regular, in: .capsule)
    } else {
      Capsule().fill(.ultraThinMaterial)
    }
  }
}
```

```swift
// apps/ios/Sources/Features/Home/HomeView.swift
import SwiftUI

struct HomeView: View {
  let model: HomeFeatureModel

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 20) {
        Text(model.summary.heroTitle)
          .font(.system(size: 34, weight: .bold))

        HStack(spacing: 12) {
          ForEach(Array(model.summary.rings.enumerated()), id: \.offset) { _, ring in
            MetricRingCard(ring: ring)
          }
        }
      }
      .padding(20)
    }
    .background(AppTheme.background.ignoresSafeArea())
  }
}
```

```swift
// apps/ios/Sources/Features/Workouts/WorkoutsView.swift
import SwiftUI

struct WorkoutsView: View {
  @Bindable var model: WorkoutsFeatureModel

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 20) {
        SectionHeader(title: "训练库", subtitle: "按分类浏览今日训练")

        HStack(spacing: 10) {
          ForEach(WorkoutItem.Category.allCases, id: \.self) { category in
            Button(category.rawValue.capitalized) {
              model.selectCategory(category)
            }
            .buttonStyle(.borderedProminent)
            .tint(model.selectedCategory == category ? AppTheme.accent : .gray.opacity(0.3))
          }
        }

        VStack(spacing: 12) {
          ForEach(model.visibleWorkouts) { workout in
            WorkoutCard(workout: workout)
          }
        }
      }
      .padding(20)
    }
    .background(AppTheme.background.ignoresSafeArea())
  }
}
```

```swift
// apps/ios/Sources/Features/Profile/ProfileView.swift
import SwiftUI

struct ProfileView: View {
  let profile: ProfileSummary

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 20) {
        SectionHeader(title: profile.name, subtitle: "本周已连续训练 \(profile.streakDays) 天")
        ProfileStatCard(title: "周目标", value: profile.weeklyGoalText)
        ProfileStatCard(title: "成就徽章", value: "已点亮 6 枚徽章")
        ProfileStatCard(title: "偏好设置", value: "通知、主题、健康数据")
      }
      .padding(20)
    }
    .background(AppTheme.background.ignoresSafeArea())
  }
}
```

```swift
// apps/ios/Sources/Shared/Components/MetricRingCard.swift
import SwiftUI

struct MetricRingCard: View {
  let ring: ActivitySummary.Ring

  var body: some View {
    VStack(alignment: .leading, spacing: 12) {
      ProgressView(value: ring.progress)
        .tint(AppTheme.accent)
      Text(ring.title)
        .font(.headline)
      Text(ring.valueText)
        .font(.subheadline)
        .foregroundStyle(.secondary)
    }
    .padding(16)
    .frame(maxWidth: .infinity, alignment: .leading)
    .background(AppTheme.secondaryCard, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
  }
}
```

```swift
// apps/ios/Sources/Shared/Components/SectionHeader.swift
import SwiftUI

struct SectionHeader: View {
  let title: String
  let subtitle: String

  var body: some View {
    VStack(alignment: .leading, spacing: 4) {
      Text(title)
        .font(.system(size: 30, weight: .bold))
      Text(subtitle)
        .font(.subheadline)
        .foregroundStyle(.secondary)
    }
  }
}
```

```swift
// apps/ios/Sources/Shared/Components/WorkoutCard.swift
import SwiftUI

struct WorkoutCard: View {
  let workout: WorkoutItem

  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      Text(workout.title)
        .font(.headline)
      Text(workout.subtitle)
        .font(.subheadline)
        .foregroundStyle(.secondary)
      Text(workout.durationText)
        .font(.footnote.weight(.semibold))
        .foregroundStyle(AppTheme.foreground)
    }
    .padding(16)
    .frame(maxWidth: .infinity, alignment: .leading)
    .background(Color.white, in: RoundedRectangle(cornerRadius: 22, style: .continuous))
  }
}
```

```swift
// apps/ios/Sources/Shared/Components/ProfileStatCard.swift
import SwiftUI

struct ProfileStatCard: View {
  let title: String
  let value: String

  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      Text(title)
        .font(.headline)
      Text(value)
        .font(.subheadline)
        .foregroundStyle(.secondary)
    }
    .padding(16)
    .frame(maxWidth: .infinity, alignment: .leading)
    .background(Color.white, in: RoundedRectangle(cornerRadius: 22, style: .continuous))
  }
}
```

同时更新 `AppModel`：

```swift
import Observation

@Observable
final class AppModel {
  enum Tab: String, CaseIterable {
    case home
    case workouts
    case profile

    var title: String {
      switch self {
      case .home: "概览"
      case .workouts: "训练"
      case .profile: "我的"
      }
    }
  }

  let repository = MockDashboardRepository()
  var selectedTab: Tab = .home
}
```

- [ ] **Step 4: 运行构建和测试，确认 UI 骨架编译通过**

Run: `DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer xcodebuild -project apps/ios/GaogeIOS.xcodeproj -scheme GaogeIOS -destination 'generic/platform=iOS Simulator' build`
Expected: PASS。

Run: `DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer xcodebuild -project apps/ios/GaogeIOS.xcodeproj -scheme GaogeIOS -destination 'generic/platform=iOS Simulator' test`
Expected: PASS。

- [ ] **Step 5: 提交 UI 骨架实现**

```bash
git add apps/ios
git commit -m "feat: add gaoge ios fitness shell ui"
```

### Task 4: 接入仓库命令、文档与最终验证

**Files:**

- Modify: `package.json`
- Modify: `AGENTS.md`
- Modify: `docs/superpowers/plans/2026-05-26-gaoge-ios-bootstrap.md`

- [ ] **Step 1: 先写失败的命令入口检查**

```bash
node -e "const pkg=require('./package.json'); ['dev:ios','build:ios','typecheck:ios'].forEach(name=>{ if(!pkg.scripts[name]) throw new Error(name) })"
```

- [ ] **Step 2: 运行检查，确认当前失败**

Run: `node -e "const pkg=require('./package.json'); ['dev:ios','build:ios','typecheck:ios'].forEach(name=>{ if(!pkg.scripts[name]) throw new Error(name) })"`
Expected: FAIL，因为根脚本尚未添加。

- [ ] **Step 3: 补充脚本和文档**

```json
// package.json
{
  "scripts": {
    "dev:ios": "open apps/ios/GaogeIOS.xcodeproj",
    "build:ios": "DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer xcodebuild -project apps/ios/GaogeIOS.xcodeproj -scheme GaogeIOS -destination 'generic/platform=iOS Simulator' build",
    "typecheck:ios": "DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer xcodebuild -project apps/ios/GaogeIOS.xcodeproj -scheme GaogeIOS -destination 'generic/platform=iOS Simulator' build"
  }
}
```

```md
<!-- AGENTS.md -->

- `apps/ios` 已完成首轮接入，当前为真实 iOS/SwiftUI 原生项目
- 根目录工作流已按应用拆分为独立部署入口，`api`、`web`、`admin`、`miniapp`、`desktop`、`ios` 应分别维护自己的发布流程
- 当前应用包括：`apps/ios`
- 常用命令新增：
  - `pnpm dev:ios`
  - `pnpm build:ios`
  - `pnpm typecheck:ios`
```

```md
<!-- apps/ios/README.md -->

# GaogeIOS

- 工程位置：`apps/ios/GaogeIOS.xcodeproj`
- 源码目录：`apps/ios/Sources`
- 测试目录：`apps/ios/Tests`
- 最低系统版本：`iOS 18.0`
- `iOS 26` 上启用 Liquid Glass 底部导航
- 构建命令：`pnpm build:ios`
```

- [ ] **Step 4: 运行最终验证**

Run: `node -e "const pkg=require('./package.json'); ['dev:ios','build:ios','typecheck:ios'].forEach(name=>{ if(!pkg.scripts[name]) throw new Error(name) })"`
Expected: PASS。

Run: `pnpm build:ios`
Expected: PASS。

Run: `pnpm typecheck:ios`
Expected: PASS。

Run: `DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer xcrun simctl list devices available`
Expected: 当前环境大概率返回 `CoreSimulatorService connection became invalid`。把这条结果记录为外部环境限制，不阻断已通过的编译与测试验证。

- [ ] **Step 5: 提交仓库接入与文档更新**

```bash
git add package.json AGENTS.md apps/ios/README.md docs/superpowers/plans/2026-05-26-gaoge-ios-bootstrap.md
git commit -m "chore: wire gaoge ios workspace entry"
```
