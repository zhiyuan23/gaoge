import XCTest
@testable import GaogeIOS

final class MockDashboardRepositoryTests: XCTestCase {
  func testMakeActivitySummaryProvidesThreeRings() {
    let repository = MockDashboardRepository()

    let summary = repository.makeActivitySummary()

    XCTAssertEqual(summary.rings.count, 3)
    XCTAssertEqual(summary.heroTitle, "今日概览")
  }
}
