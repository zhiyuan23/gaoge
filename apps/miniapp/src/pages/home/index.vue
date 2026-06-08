<script setup lang="ts">
import PressFeedback from '@/components/base/PressFeedback.vue'

const safeTop = ref(24)

const statList = [
  { value: '128+', label: '精品课程' },
  { value: '36', label: '认证教练' },
  { value: '4.9', label: '学员评分' },
]

const highlightList = [
  {
    title: '训练营',
    desc: '分龄课程 + 每周计划',
    accent: 'orange',
    tag: 'LIVE',
  },
  {
    title: '比赛库',
    desc: '赛后复盘与剪辑模板',
    accent: 'purple',
    tag: 'NEW',
  },
  {
    title: '体能课',
    desc: '速度 爆发 核心训练',
    accent: 'mint',
    tag: 'HOT',
  },
]

const courseList = [
  {
    title: '边路突破训练营',
    coach: 'Coach Ryan',
    lessons: '18 节课',
    duration: '6 小时',
    level: 'U10-U12',
    accent: 'orange',
  },
  {
    title: '中场视野与传控',
    coach: 'Coach Allen',
    lessons: '24 节课',
    duration: '8 小时',
    level: 'U12-U15',
    accent: 'purple',
  },
  {
    title: '射门动作拆解',
    coach: 'Coach Mason',
    lessons: '12 节课',
    duration: '4 小时',
    level: '全位置',
    accent: 'mint',
  },
]

const mentorList = [
  {
    name: '陈启航',
    role: '技术总监',
    badge: 'UEFA B',
    accent: 'purple',
  },
  {
    name: '周言',
    role: '青训教练',
    badge: '速度专项',
    accent: 'orange',
  },
]

const journeyList = [
  {
    step: '01',
    title: '测评建档',
    desc: '根据年龄、位置、技术项生成个人训练画像。',
  },
  {
    step: '02',
    title: '跟练打卡',
    desc: '每周跟练视频 + 训练清单，形成稳定进阶节奏。',
  },
  {
    step: '03',
    title: '复盘升级',
    desc: '通过比赛视频与教练点评持续修正动作细节。',
  },
]

onMounted(() => {
  safeTop.value = (uni.getSystemInfoSync().statusBarHeight || 0) + 20
})
</script>

<template>
  <view class="page home-page">
    <view class="page-shell">
      <view class="hero-wrap" :style="{ paddingTop: `${safeTop}px` }">
        <view class="float-blob blob-left" />
        <view class="float-blob blob-right" />

        <view class="nav-shell clay-card">
          <view class="brand">
            <view class="brand-mark">G</view>
            <view>
              <text class="brand-name">Gaoge Academy</text>
              <text class="brand-sub">足球学习平台</text>
            </view>
          </view>
          <view class="nav-pill">2026 春季课表</view>
        </view>

        <view class="hero-card">
          <view class="hero-copy">
            <view class="hero-badge">
              <view class="hero-badge-dot" />
              <text>New: AI 训练计划</text>
            </view>
            <text class="hero-title">
              学会踢球，
              <text class="hero-title-accent">更会成长</text>
            </text>
            <text class="hero-desc">
              把课程、打卡、比赛复盘放进一个首页，给青训球员一套更清晰的成长节奏。
            </text>

            <view class="hero-actions">
              <PressFeedback>
                <view class="cta-button cta-primary">
                  <text>开始体验</text>
                  <text class="cta-arrow">&gt;</text>
                </view>
              </PressFeedback>
              <PressFeedback>
                <view class="cta-button cta-secondary">
                  <text>查看课程</text>
                </view>
              </PressFeedback>
            </view>

            <view class="stat-row">
              <view v-for="item in statList" :key="item.label" class="stat-item">
                <text class="stat-value">{{ item.value }}</text>
                <text class="stat-label">{{ item.label }}</text>
              </view>
            </view>
          </view>

          <view class="hero-panel clay-card">
            <view class="panel-head">
              <view class="panel-icon">P</view>
              <view>
                <text class="panel-title">边路突破训练营</text>
                <text class="panel-meta">12 节课 · 4 周计划</text>
              </view>
            </view>
            <view class="progress-box">
              <view class="progress-label">
                <text>本周进度</text>
                <text class="progress-value">65%</text>
              </view>
              <view class="progress-track">
                <view class="progress-fill" />
              </view>
            </view>
            <view class="panel-tags">
              <view class="panel-tag tag-orange">带球</view>
              <view class="panel-tag tag-purple">观察</view>
              <view class="panel-tag tag-mint">变向</view>
            </view>
            <view class="panel-button">继续学习</view>

            <view class="float-card float-card-top">LIVE</view>
            <view class="float-card float-card-left">12</view>
            <view class="float-card float-card-right">TOP</view>
          </view>
        </view>
      </view>

      <view class="section highlight-section">
        <view
          v-for="item in highlightList"
          :key="item.title"
          :class="['highlight-card', `accent-${item.accent}`]"
        >
          <view class="highlight-top">
            <text class="highlight-title">{{ item.title }}</text>
            <text class="highlight-tag">{{ item.tag }}</text>
          </view>
          <text class="highlight-desc">{{ item.desc }}</text>
        </view>
      </view>

      <view class="section">
        <view class="section-head">
          <text class="section-kicker">Popular Courses</text>
          <text class="section-title">本周热门课程</text>
          <text class="section-desc"
            >延续参考页的大色块和厚描边，但内容改成更贴近足球训练的首页入口。</text
          >
        </view>
        <view class="course-list">
          <view v-for="item in courseList" :key="item.title" class="course-card clay-card">
            <view :class="['course-icon', `accent-${item.accent}`]">
              <text>{{ item.title.slice(0, 1) }}</text>
            </view>
            <view class="course-body">
              <text class="course-title">{{ item.title }}</text>
              <text class="course-coach">{{ item.coach }}</text>
              <view class="course-meta">
                <text>{{ item.lessons }}</text>
                <text>{{ item.duration }}</text>
                <text>{{ item.level }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <view class="section mentor-section">
        <view class="section-head">
          <text class="section-kicker">Expert Coaches</text>
          <text class="section-title">教练阵容</text>
        </view>
        <view class="mentor-list">
          <view v-for="item in mentorList" :key="item.name" class="mentor-card clay-card">
            <view :class="['mentor-avatar', `accent-${item.accent}`]">
              <text>{{ item.name.slice(0, 1) }}</text>
            </view>
            <text class="mentor-name">{{ item.name }}</text>
            <text class="mentor-role">{{ item.role }}</text>
            <text class="mentor-badge">{{ item.badge }}</text>
          </view>
        </view>
      </view>

      <view class="section journey-section">
        <view class="section-head">
          <text class="section-kicker">Journey</text>
          <text class="section-title">三步建立成长路径</text>
        </view>
        <view class="journey-list">
          <view v-for="item in journeyList" :key="item.step" class="journey-card">
            <text class="journey-step">{{ item.step }}</text>
            <text class="journey-title">{{ item.title }}</text>
            <text class="journey-desc">{{ item.desc }}</text>
          </view>
        </view>
      </view>

      <view class="section">
        <view class="cta-panel clay-card">
          <view>
            <text class="cta-panel-title">加入高歌青训首页体验</text>
            <text class="cta-panel-desc"
              >静态页面先完成风格落地，后续再接课程、报名和比赛数据。</text
            >
          </view>
          <PressFeedback>
            <view class="cta-button cta-primary cta-panel-button">
              <text>立即加入</text>
            </view>
          </PressFeedback>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.home-page {
  --home-primary: #22c55d;
  --home-primary-soft: #86efac;
  --home-primary-pale: #bbf7d0;
  --home-primary-fog: rgb(34 197 93 / 24%);

  background:
    radial-gradient(circle at top left, rgb(134 239 172 / 52%), transparent 28%),
    radial-gradient(circle at top right, rgb(215 198 255 / 76%), transparent 26%), #fff8ea;
}

.page-shell {
  min-height: 100%;
  padding: 0 28rpx 56rpx;
}

.hero-wrap {
  position: relative;
  padding-bottom: 28rpx;
}

.float-blob {
  position: absolute;
  z-index: 0;
  border-radius: 999rpx;
  filter: blur(8rpx);
}

.blob-left {
  top: 120rpx;
  left: -24rpx;
  width: 144rpx;
  height: 144rpx;
  background: var(--home-primary-fog);
}

.blob-right {
  top: 260rpx;
  right: 12rpx;
  width: 184rpx;
  height: 184rpx;
  background: rgb(192 166 255 / 40%);
}

.clay-card {
  position: relative;
  z-index: 1;
  border: 4rpx solid #1d1b26;
  border-radius: 36rpx;
  box-shadow: 0 14rpx 0 #1d1b26;
}

.nav-shell {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22rpx 24rpx;
  background: rgb(255 255 255 / 92%);
}

.brand {
  display: flex;
  align-items: center;
  gap: 18rpx;
}

.brand-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72rpx;
  height: 72rpx;
  border: 4rpx solid #1d1b26;
  border-radius: 24rpx;
  background: var(--home-primary);
  font-size: 34rpx;
  font-weight: 800;
  color: #1d1b26;
}

.brand-name,
.brand-sub,
.hero-badge,
.hero-title,
.hero-desc,
.stat-value,
.stat-label,
.panel-title,
.panel-meta,
.section-kicker,
.section-title,
.section-desc,
.course-title,
.course-coach,
.course-meta,
.mentor-name,
.mentor-role,
.mentor-badge,
.journey-step,
.journey-title,
.journey-desc,
.cta-panel-title,
.cta-panel-desc {
  display: block;
}

.brand-name {
  font-size: 30rpx;
  font-weight: 800;
  color: #1d1b26;
  line-height: 1.1;
}

.brand-sub {
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #6f6a7d;
}

.nav-pill {
  padding: 14rpx 20rpx;
  border: 4rpx solid #1d1b26;
  border-radius: 999rpx;
  background: #d9f7c8;
  font-size: 22rpx;
  font-weight: 700;
  color: #1d1b26;
}

.hero-card {
  position: relative;
  z-index: 1;
  margin-top: 28rpx;
}

.hero-copy {
  padding: 18rpx 4rpx 0;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 12rpx;
  padding: 14rpx 20rpx;
  border: 4rpx solid #1d1b26;
  border-radius: 999rpx;
  background: #d9f7c8;
  font-size: 22rpx;
  font-weight: 700;
  color: #1d1b26;
}

.hero-badge-dot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 999rpx;
  background: var(--home-primary);
}

.hero-title {
  margin-top: 28rpx;
  font-size: 74rpx;
  font-weight: 900;
  line-height: 1.08;
  color: #1d1b26;
}

.hero-title-accent {
  color: var(--home-primary);
}

.hero-desc {
  margin-top: 24rpx;
  font-size: 28rpx;
  line-height: 1.7;
  color: #6f6a7d;
}

.hero-actions {
  display: flex;
  gap: 20rpx;
  margin-top: 28rpx;
}

.cta-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  min-width: 220rpx;
  padding: 24rpx 28rpx;
  border: 4rpx solid #1d1b26;
  border-radius: 28rpx;
  font-size: 28rpx;
  font-weight: 800;
  line-height: 1;
  color: #1d1b26;
  box-shadow: 0 12rpx 0 #1d1b26;
}

.cta-primary {
  background: var(--home-primary);
}

.cta-secondary {
  background: #fff;
}

.cta-arrow {
  font-size: 24rpx;
}

.stat-row {
  display: flex;
  gap: 20rpx;
  margin-top: 36rpx;
}

.stat-item {
  flex: 1;
}

.stat-value {
  font-size: 40rpx;
  font-weight: 800;
  color: #1d1b26;
}

.stat-label {
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #6f6a7d;
}

.hero-panel {
  margin-top: 34rpx;
  padding: 28rpx;
  background: #fff;
}

.panel-head {
  display: flex;
  align-items: center;
  gap: 18rpx;
}

.panel-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 88rpx;
  height: 88rpx;
  border: 4rpx solid #1d1b26;
  border-radius: 26rpx;
  background: #b69cff;
  font-size: 34rpx;
  font-weight: 800;
  color: #1d1b26;
}

.panel-title {
  font-size: 32rpx;
  font-weight: 800;
  color: #1d1b26;
}

.panel-meta {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #6f6a7d;
}

.progress-box {
  margin-top: 28rpx;
}

.progress-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14rpx;
  font-size: 24rpx;
  color: #6f6a7d;
}

.progress-value {
  font-weight: 800;
  color: var(--home-primary);
}

.progress-track {
  height: 24rpx;
  padding: 3rpx;
  border: 4rpx solid #1d1b26;
  border-radius: 999rpx;
  background: #f0ebde;
}

.progress-fill {
  width: 65%;
  height: 100%;
  border-radius: 999rpx;
  background: var(--home-primary);
}

.panel-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx;
  margin-top: 24rpx;
}

.panel-tag {
  padding: 12rpx 18rpx;
  border: 4rpx solid #1d1b26;
  border-radius: 999rpx;
  font-size: 22rpx;
  font-weight: 700;
  color: #1d1b26;
}

.tag-orange {
  background: var(--home-primary-pale);
}

.tag-purple {
  background: #dacafc;
}

.tag-mint {
  background: #d9f7c8;
}

.panel-button {
  margin-top: 24rpx;
  padding: 24rpx 0;
  border: 4rpx solid #1d1b26;
  border-radius: 24rpx;
  background: var(--home-primary);
  text-align: center;
  font-size: 28rpx;
  font-weight: 800;
  color: #1d1b26;
}

.float-card {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4rpx solid #1d1b26;
  font-size: 22rpx;
  font-weight: 800;
  color: #1d1b26;
}

.float-card-top {
  top: -24rpx;
  right: 20rpx;
  width: 120rpx;
  height: 84rpx;
  border-radius: 28rpx;
  background: var(--home-primary-soft);
}

.float-card-left {
  bottom: -20rpx;
  left: 18rpx;
  width: 88rpx;
  height: 88rpx;
  border-radius: 28rpx;
  background: #b69cff;
}

.float-card-right {
  top: 180rpx;
  right: -18rpx;
  width: 92rpx;
  height: 92rpx;
  border-radius: 999rpx;
  background: #d9f7c8;
}

.section {
  margin-top: 34rpx;
}

.highlight-section {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.highlight-card {
  padding: 28rpx 26rpx;
  border: 4rpx solid #1d1b26;
  border-radius: 32rpx;
  box-shadow: 0 12rpx 0 #1d1b26;
}

.highlight-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.highlight-title {
  font-size: 32rpx;
  font-weight: 800;
  color: #1d1b26;
}

.highlight-tag {
  padding: 8rpx 14rpx;
  border: 4rpx solid #1d1b26;
  border-radius: 999rpx;
  background: rgb(255 255 255 / 52%);
  font-size: 20rpx;
  font-weight: 800;
  color: #1d1b26;
}

.highlight-desc {
  display: block;
  margin-top: 14rpx;
  font-size: 24rpx;
  line-height: 1.6;
  color: #443f52;
}

.section-head {
  padding: 0 6rpx;
}

.section-kicker {
  font-size: 22rpx;
  font-weight: 800;
  color: #6f6a7d;
  text-transform: uppercase;
  letter-spacing: 2rpx;
}

.section-title {
  margin-top: 12rpx;
  font-size: 46rpx;
  font-weight: 900;
  line-height: 1.18;
  color: #1d1b26;
}

.section-desc {
  margin-top: 16rpx;
  font-size: 26rpx;
  line-height: 1.7;
  color: #6f6a7d;
}

.course-list,
.mentor-list,
.journey-list {
  display: flex;
  flex-direction: column;
  gap: 22rpx;
  margin-top: 26rpx;
}

.course-card {
  display: flex;
  gap: 22rpx;
  padding: 28rpx;
  background: #fff;
}

.course-icon,
.mentor-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 4rpx solid #1d1b26;
  color: #1d1b26;
  font-weight: 800;
}

.course-icon {
  width: 96rpx;
  height: 96rpx;
  border-radius: 30rpx;
  font-size: 38rpx;
}

.course-body {
  flex: 1;
}

.course-title {
  font-size: 32rpx;
  font-weight: 800;
  line-height: 1.35;
  color: #1d1b26;
}

.course-coach {
  margin-top: 10rpx;
  font-size: 24rpx;
  color: #6f6a7d;
}

.course-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 16rpx;
}

.course-meta text {
  padding: 10rpx 14rpx;
  border-radius: 999rpx;
  background: #f3efe5;
  font-size: 22rpx;
  color: #544f60;
}

.mentor-list {
  flex-direction: row;
}

.mentor-card {
  flex: 1;
  padding: 28rpx 22rpx;
  background: #fff;
  text-align: center;
}

.mentor-avatar {
  width: 120rpx;
  height: 120rpx;
  margin: 0 auto;
  border-radius: 36rpx;
  font-size: 42rpx;
}

.mentor-name {
  margin-top: 20rpx;
  font-size: 30rpx;
  font-weight: 800;
  color: #1d1b26;
}

.mentor-role {
  margin-top: 10rpx;
  font-size: 24rpx;
  color: #6f6a7d;
}

.mentor-badge {
  margin-top: 16rpx;
  padding: 10rpx 14rpx;
  border-radius: 999rpx;
  background: #f3efe5;
  font-size: 22rpx;
  color: #544f60;
}

.journey-card {
  padding: 28rpx;
  border: 4rpx solid #1d1b26;
  border-radius: 32rpx;
  background: #fff;
  box-shadow: 0 12rpx 0 #1d1b26;
}

.journey-step {
  font-size: 22rpx;
  font-weight: 900;
  letter-spacing: 2rpx;
  color: var(--home-primary);
}

.journey-title {
  margin-top: 12rpx;
  font-size: 32rpx;
  font-weight: 800;
  color: #1d1b26;
}

.journey-desc {
  margin-top: 14rpx;
  font-size: 24rpx;
  line-height: 1.7;
  color: #6f6a7d;
}

.cta-panel {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  padding: 34rpx 28rpx;
  background: var(--home-primary-soft);
}

.cta-panel-title {
  font-size: 40rpx;
  font-weight: 900;
  line-height: 1.2;
  color: #1d1b26;
}

.cta-panel-desc {
  margin-top: 14rpx;
  font-size: 24rpx;
  line-height: 1.7;
  color: #433d4f;
}

.cta-panel-button {
  min-width: 0;
  align-self: flex-start;
  background: #fff;
}

.accent-orange {
  background: var(--home-primary-pale);
}

.accent-purple {
  background: #cdb6ff;
}

.accent-mint {
  background: #d9f7c8;
}
</style>
