struct MockDashboardRepository {
  func makeActivitySummary() -> ActivitySummary {
    ActivitySummary(
      heroTitle: "今日概览",
      rings: [
        .init(title: "Move", valueText: "540 / 700 KCAL", progress: 0.77),
        .init(title: "Exercise", valueText: "32 / 45 MIN", progress: 0.71),
        .init(title: "Stand", valueText: "8 / 12 HRS", progress: 0.67),
      ]
    )
  }

  func makeWorkouts() -> [WorkoutItem] {
    [
      .init(id: "strength-1", title: "力量循环", subtitle: "下肢激活", durationText: "32 分钟", category: .strength),
      .init(id: "cardio-1", title: "高效燃脂", subtitle: "HIIT", durationText: "18 分钟", category: .cardio),
      .init(id: "recovery-1", title: "恢复拉伸", subtitle: "柔韧", durationText: "12 分钟", category: .recovery),
    ]
  }

  func makeProfileSummary() -> ProfileSummary {
    ProfileSummary(name: "Avery", streakDays: 4, weeklyGoalText: "本周完成 4 / 5 次训练")
  }
}
