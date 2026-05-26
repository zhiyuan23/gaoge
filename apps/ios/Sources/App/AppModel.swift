import Observation

@Observable
final class AppModel {
  enum Tab: String, CaseIterable {
    case home
    case workouts
    case profile

    var title: String {
      switch self {
      case .home:
        return "概览"
      case .workouts:
        return "训练"
      case .profile:
        return "我的"
      }
    }
  }

  let repository = MockDashboardRepository()
  var selectedTab: Tab = .home
}
