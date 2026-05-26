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
