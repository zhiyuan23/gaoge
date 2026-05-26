import XCTest
@testable import GaogeIOS

final class WorkoutsFeatureModelTests: XCTestCase {
  func testApplyCategoryFiltersWorkouts() {
    let repository = MockDashboardRepository()
    let model = WorkoutsFeatureModel(repository: repository)

    model.selectCategory(.strength)

    XCTAssertTrue(model.visibleWorkouts.allSatisfy { $0.category == .strength })
    XCTAssertEqual(model.selectedCategory, .strength)
  }
}
