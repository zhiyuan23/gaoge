import SwiftUI

@main
struct GaogeIOSApp: App {
  @State private var appModel = AppModel()

  var body: some Scene {
    WindowGroup {
      RootTabView(appModel: appModel)
    }
  }
}
