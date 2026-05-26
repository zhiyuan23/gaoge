import SwiftUI

struct HomeView: View {
  let model: HomeFeatureModel

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 20) {
        Text(model.summary.heroTitle)
          .font(.system(size: 34, weight: .bold))

        HStack(spacing: 12) {
          ForEach(Array(model.summary.rings.enumerated()), id: \.offset) { item in
            MetricRingCard(ring: item.element)
          }
        }
      }
      .padding(20)
    }
    .background(AppTheme.background.ignoresSafeArea())
  }
}
