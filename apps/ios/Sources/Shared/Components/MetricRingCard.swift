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
