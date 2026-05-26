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
      Capsule().fill(.white.opacity(0.72))
    } else {
      Capsule().fill(.clear)
    }
  }

  // Xcode 16.2 ships the iOS 18.2 SDK, which does not expose the planned Liquid Glass APIs yet.
  private var containerBackground: some View {
    Capsule().fill(.ultraThinMaterial)
  }
}
