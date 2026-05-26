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
