import SwiftUI

struct RootTabView: View {
  let appModel: AppModel

  var body: some View {
    Text(appModel.selectedTab.rawValue.capitalized)
  }
}
