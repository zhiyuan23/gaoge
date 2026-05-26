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
