struct HomeFeatureModel {
  let summary: ActivitySummary

  init(repository: MockDashboardRepository) {
    summary = repository.makeActivitySummary()
  }
}
