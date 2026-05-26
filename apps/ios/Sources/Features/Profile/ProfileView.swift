import SwiftUI

struct ProfileView: View {
  let profile: ProfileSummary

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 20) {
        SectionHeader(title: profile.name, subtitle: "本周已连续训练 \(profile.streakDays) 天")
        ProfileStatCard(title: "周目标", value: profile.weeklyGoalText)
        ProfileStatCard(title: "成就徽章", value: "已点亮 6 枚徽章")
        ProfileStatCard(title: "偏好设置", value: "通知、主题、健康数据")
      }
      .padding(20)
    }
    .background(AppTheme.background.ignoresSafeArea())
  }
}
