struct ActivitySummary {
  struct Ring {
    let title: String
    let valueText: String
    let progress: Double
  }

  let heroTitle: String
  let rings: [Ring]
}
