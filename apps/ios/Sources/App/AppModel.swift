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
