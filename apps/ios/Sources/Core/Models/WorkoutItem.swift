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
