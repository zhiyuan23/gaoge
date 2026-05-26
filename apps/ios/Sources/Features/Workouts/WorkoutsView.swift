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
