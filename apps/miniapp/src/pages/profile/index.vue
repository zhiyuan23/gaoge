<script setup lang="ts">
type AbilityTone = 'orange' | 'amber' | 'green'

type AbilityItem = {
  key: string
  label: string
  value: number
  tone: AbilityTone
  positionClass: string
}

const tabs = ['数据', '比赛', '能力值', '动态', '资料']

const playerProfile = {
  name: '梅西',
  englishName: 'L.Messi',
  club: '迈阿密国际',
  clubNumber: '10号',
  nationalTeam: '阿根廷',
  nationalNumber: '10号',
  nationality: '阿根廷',
  country: '西班牙',
  height: 170,
  weight: 72,
  age: 38,
  position: '前锋',
  marketValue: '1500万欧',
  overall: 86,
  preferredFoot: '左脚',
  abilities: [
    {
      key: 'pace',
      label: '速度',
      value: 77,
      tone: 'amber',
      positionClass: 'label-top',
    },
    {
      key: 'shooting',
      label: '射门',
      value: 84,
      tone: 'orange',
      positionClass: 'label-top-right',
    },
    {
      key: 'passing',
      label: '传球',
      value: 86,
      tone: 'orange',
      positionClass: 'label-bottom-right',
    },
    {
      key: 'dribbling',
      label: '盘带',
      value: 87,
      tone: 'orange',
      positionClass: 'label-bottom',
    },
    {
      key: 'defending',
      label: '防守',
      value: 36,
      tone: 'green',
      positionClass: 'label-bottom-left',
    },
    {
      key: 'physical',
      label: '身体素质',
      value: 63,
      tone: 'amber',
      positionClass: 'label-top-left',
    },
  ] as AbilityItem[],
}

const radarCenter = 160
const radarRadius = 112
const radarMaxValue = 100

const buildRadarPoints = (abilities: AbilityItem[]) =>
  abilities
    .map((ability, index) => {
      const angle = (-90 + index * 60) * (Math.PI / 180)
      const radius = (ability.value / radarMaxValue) * radarRadius
      const x = radarCenter + Math.cos(angle) * radius
      const y = radarCenter + Math.sin(angle) * radius

      return `${x},${y}`
    })
    .join(' ')

const buildRadarDots = (abilities: AbilityItem[]) =>
  abilities.map((ability, index) => {
    const angle = (-90 + index * 60) * (Math.PI / 180)
    const radius = (ability.value / radarMaxValue) * radarRadius

    return {
      key: ability.key,
      x: radarCenter + Math.cos(angle) * radius,
      y: radarCenter + Math.sin(angle) * radius,
    }
  })

const radarPolygonPoints = buildRadarPoints(playerProfile.abilities)
const radarDots = buildRadarDots(playerProfile.abilities)

const abilityClass = (tone: AbilityTone) => `is-${tone}`
</script>

<template>
  <view class="profile-page">
    <view class="hero-section">
      <view class="hero-watermark">
        <view class="watermark-ring outer" />
        <view class="watermark-ring inner" />
        <view class="watermark-text top">CLUB</view>
        <view class="watermark-text bottom">MMXX</view>
      </view>

      <view class="player-intro">
        <view class="avatar-wrap">
          <view class="avatar-ring">
            <view class="avatar-placeholder">
              <view class="avatar-face">
                <view class="avatar-hair" />
                <view class="avatar-beard" />
              </view>
            </view>
          </view>
        </view>

        <view class="player-main">
          <text class="player-name">{{ playerProfile.name }}</text>
          <text class="player-subname">{{ playerProfile.englishName }}</text>

          <view class="identity-row">
            <view class="flag-card">
              <view class="flag flag-argentina" />
              <text>{{ playerProfile.nationality }}</text>
            </view>
            <text class="identity-separator">|</text>
            <view class="flag-card">
              <view class="flag flag-spain" />
              <text>{{ playerProfile.country }}</text>
            </view>
          </view>

          <text class="player-meta">
            {{ playerProfile.height }}cm / {{ playerProfile.weight }}kg / {{ playerProfile.age }}岁
            /
            {{ playerProfile.position }}
          </text>
        </view>
      </view>

      <view class="summary-row">
        <view class="summary-item">
          <text class="summary-value">{{ playerProfile.marketValue }}</text>
          <text class="summary-label">身价</text>
        </view>

        <view class="summary-divider" />

        <view class="summary-item">
          <text class="summary-value">{{ playerProfile.club }}/{{ playerProfile.clubNumber }}</text>
          <text class="summary-label">俱乐部/号码</text>
        </view>

        <view class="summary-divider" />

        <view class="summary-item">
          <text class="summary-value">
            {{ playerProfile.nationalTeam }}/{{ playerProfile.nationalNumber }}
          </text>
          <text class="summary-label">国家队/号码</text>
        </view>
      </view>
    </view>

    <view class="tab-bar">
      <view
        v-for="tab in tabs"
        :key="tab"
        class="tab-item"
        :class="{ 'is-active': tab === '能力值' }"
      >
        <text>{{ tab }}</text>
        <view v-if="tab === '能力值'" class="tab-indicator" />
      </view>
    </view>

    <view class="section">
      <view class="section-header">
        <text class="section-title">综合能力</text>
        <view class="image-action">
          <view class="image-icon">
            <view class="image-icon__mountain" />
            <view class="image-icon__sun" />
          </view>
          <text>生成图片</text>
        </view>
      </view>

      <view class="ability-layout">
        <view class="overall-card">
          <text class="overall-value">{{ playerProfile.overall }}</text>
        </view>

        <view class="radar-wrap">
          <view
            v-for="ability in playerProfile.abilities"
            :key="ability.key"
            class="ability-label"
            :class="[ability.positionClass, abilityClass(ability.tone)]"
          >
            <text class="ability-label__value">{{ ability.value }}</text>
            <text class="ability-label__name">{{ ability.label }}</text>
          </view>

          <svg
            class="radar-svg"
            viewBox="0 0 320 320"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <polygon
              points="160,48 256,104 256,216 160,272 64,216 64,104"
              class="radar-grid radar-grid--outer"
            />
            <polygon
              points="160,76 232,118 232,202 160,244 88,202 88,118"
              class="radar-grid radar-grid--middle"
            />
            <polygon
              points="160,104 208,132 208,188 160,216 112,188 112,132"
              class="radar-grid radar-grid--inner"
            />

            <line x1="160" y1="48" x2="160" y2="272" class="radar-axis" />
            <line x1="64" y1="104" x2="256" y2="216" class="radar-axis" />
            <line x1="64" y1="216" x2="256" y2="104" class="radar-axis" />

            <polygon :points="radarPolygonPoints" class="radar-shape" />

            <circle
              v-for="dot in radarDots"
              :key="dot.key"
              :cx="dot.x"
              :cy="dot.y"
              r="5"
              class="radar-dot"
            />
          </svg>
        </view>
      </view>
    </view>

    <view class="section section-position">
      <view class="section-header">
        <text class="section-title">位置介绍</text>
      </view>

      <view class="position-layout">
        <view class="pitch-card">
          <view class="pitch pitch-main">
            <view class="pitch-line pitch-line--vertical" />
            <view class="pitch-line pitch-line--center-circle" />
            <view class="penalty-box penalty-box--left" />
            <view class="penalty-box penalty-box--right" />
            <view class="goal-box goal-box--left" />
            <view class="goal-box goal-box--right" />
            <view class="goal-area goal-area--left" />
            <view class="goal-area goal-area--right" />
            <view class="position-marker">
              <text>ST</text>
            </view>
          </view>
        </view>

        <view class="position-copy">
          <view class="copy-item">
            <text class="copy-label">位置：</text>
            <text class="copy-value">{{ playerProfile.position }}</text>
          </view>

          <view class="copy-item">
            <text class="copy-label">惯用脚：</text>
            <text class="copy-value">{{ playerProfile.preferredFoot }}</text>
          </view>

          <view class="boots-row">
            <view class="boot boot--active">
              <view class="boot-sole" />
            </view>
            <view class="boot">
              <view class="boot-sole" />
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.profile-page {
  min-height: 100vh;
  background: #f5f7fb;
  color: #0f172a;
}

.hero-section {
  position: relative;
  overflow: hidden;
  padding: calc(env(safe-area-inset-top) + 24rpx) 32rpx 40rpx;
  background: linear-gradient(180deg, #0f6d34 0%, #116e36 100%);
}

.hero-watermark {
  position: absolute;
  top: 48rpx;
  right: -40rpx;
  width: 420rpx;
  height: 420rpx;
  opacity: 0.12;
}

.watermark-ring {
  position: absolute;
  border: 4rpx solid rgb(255 255 255 / 45%);
  border-radius: 50%;
}

.watermark-ring.outer {
  inset: 0;
}

.watermark-ring.inner {
  inset: 42rpx;
}

.watermark-text {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  color: rgb(255 255 255 / 65%);
  letter-spacing: 10rpx;
  font-size: 36rpx;
  font-weight: 700;
}

.watermark-text.top {
  top: 70rpx;
}

.watermark-text.bottom {
  bottom: 74rpx;
}

.top-bar {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 88rpx;
  height: 88rpx;
}

.nav-btn--ghost {
  justify-content: flex-end;
}

.arrow-left {
  width: 26rpx;
  height: 26rpx;
  border-top: 5rpx solid #fff;
  border-left: 5rpx solid #fff;
  transform: rotate(-45deg);
}

.more-dots {
  display: flex;
  gap: 8rpx;
  color: #fff;
  font-size: 28rpx;
  line-height: 1;
}

.app-pill {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 12rpx 26rpx;
  border-radius: 999rpx;
  background: rgb(255 255 255 / 92%);
  box-shadow: 0 8rpx 20rpx rgb(0 0 0 / 10%);
}

.app-pill__logo {
  position: relative;
  width: 34rpx;
  height: 34rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #1c7cff 0%, #0d53ca 50%, #e03131 50%, #ff6b6b 100%);
}

.app-pill__logo::after {
  position: absolute;
  inset: 9rpx;
  content: '';
  border: 3rpx solid rgb(255 255 255 / 90%);
  border-radius: 50%;
}

.app-pill__text {
  color: #111827;
  font-size: 28rpx;
  font-weight: 700;
}

.player-intro {
  position: relative;
  z-index: 2;
  display: flex;
  gap: 28rpx;
  align-items: center;
  margin-top: 52rpx;
}

.avatar-wrap {
  flex-shrink: 0;
}

.avatar-ring {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 160rpx;
  height: 160rpx;
  border: 4rpx solid rgb(255 255 255 / 45%);
  border-radius: 50%;
  background: rgb(255 255 255 / 8%);
}

.avatar-placeholder {
  position: relative;
  width: 146rpx;
  height: 146rpx;
  overflow: hidden;
  border-radius: 50%;
  background: radial-gradient(circle at 50% 18%, #fff 0%, #f4f4f5 52%, #d1d5db 100%);
}

.avatar-face {
  position: absolute;
  bottom: -8rpx;
  left: 50%;
  width: 92rpx;
  height: 108rpx;
  border-radius: 48rpx 48rpx 38rpx 38rpx;
  background: linear-gradient(180deg, #f5d1b7 0%, #d8ab8f 100%);
  transform: translateX(-50%);
}

.avatar-hair {
  position: absolute;
  top: 8rpx;
  left: -2rpx;
  width: 96rpx;
  height: 42rpx;
  border-radius: 40rpx 42rpx 20rpx 20rpx;
  background: #4b2e1d;
}

.avatar-hair::after {
  position: absolute;
  top: 24rpx;
  right: 6rpx;
  width: 26rpx;
  height: 32rpx;
  content: '';
  border-radius: 50%;
  background: #4b2e1d;
}

.avatar-beard {
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 76rpx;
  height: 46rpx;
  border-radius: 0 0 34rpx 34rpx;
  background: #7a4b2d;
  transform: translateX(-50%);
}

.player-main {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 14rpx;
  min-width: 0;
}

.player-name {
  color: #fff;
  font-size: 64rpx;
  font-weight: 700;
  line-height: 1.05;
}

.player-subname {
  color: rgb(255 255 255 / 95%);
  font-size: 32rpx;
}

.identity-row {
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx;
  align-items: center;
}

.flag-card {
  display: inline-flex;
  gap: 10rpx;
  align-items: center;
  color: rgb(255 255 255 / 82%);
  font-size: 28rpx;
}

.flag {
  width: 38rpx;
  height: 26rpx;
  overflow: hidden;
  border-radius: 4rpx;
  box-shadow: inset 0 0 0 1rpx rgb(255 255 255 / 25%);
}

.flag-argentina {
  background: linear-gradient(
    180deg,
    #7cb8ff 0%,
    #7cb8ff 33%,
    #fff 33%,
    #fff 66%,
    #7cb8ff 66%,
    #7cb8ff 100%
  );
}

.flag-spain {
  background: linear-gradient(
    180deg,
    #d62828 0%,
    #d62828 25%,
    #f7b801 25%,
    #f7b801 75%,
    #d62828 75%,
    #d62828 100%
  );
}

.identity-separator {
  color: rgb(255 255 255 / 34%);
}

.player-meta {
  color: rgb(255 255 255 / 72%);
  font-size: 26rpx;
  line-height: 1.5;
}

.summary-row {
  position: relative;
  z-index: 2;
  display: flex;
  gap: 24rpx;
  align-items: stretch;
  margin-top: 56rpx;
}

.summary-item {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 10rpx;
  align-items: center;
  min-width: 0;
  text-align: center;
}

.summary-divider {
  width: 2rpx;
  background: rgb(255 255 255 / 16%);
}

.summary-value {
  color: #fff;
  font-size: 30rpx;
  font-weight: 600;
  line-height: 1.4;
}

.summary-label {
  color: rgb(255 255 255 / 42%);
  font-size: 24rpx;
}

.tab-bar {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 0 20rpx;
  background: #fff;
  box-shadow: 0 2rpx 0 rgb(226 232 240 / 80%);
}

.tab-item {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  align-items: center;
  justify-content: center;
  min-width: 110rpx;
  height: 100rpx;
  color: #475569;
  font-size: 28rpx;
  font-weight: 500;
}

.tab-item.is-active {
  color: #0f172a;
  font-size: 32rpx;
  font-weight: 700;
}

.tab-indicator {
  width: 48rpx;
  height: 8rpx;
  border-radius: 999rpx;
  background: #2d5cff;
}

.section {
  margin-top: 22rpx;
  padding: 30rpx 32rpx 40rpx;
  background: #fff;
}

.section-position {
  padding-bottom: 64rpx;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title {
  color: #0f172a;
  font-size: 34rpx;
  font-weight: 700;
}

.image-action {
  display: flex;
  gap: 10rpx;
  align-items: center;
  color: #94a3b8;
  font-size: 24rpx;
}

.image-icon {
  position: relative;
  width: 34rpx;
  height: 26rpx;
  border: 3rpx solid #94a3b8;
  border-radius: 4rpx;
}

.image-icon__mountain {
  position: absolute;
  bottom: 4rpx;
  left: 6rpx;
  width: 18rpx;
  height: 10rpx;
  background: #94a3b8;
  clip-path: polygon(0 100%, 30% 40%, 58% 78%, 100% 0, 100% 100%);
}

.image-icon__sun {
  position: absolute;
  top: 4rpx;
  right: 5rpx;
  width: 6rpx;
  height: 6rpx;
  border-radius: 50%;
  background: #94a3b8;
}

.ability-layout {
  margin-top: 26rpx;
}

.overall-card {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 116rpx;
  height: 116rpx;
  border-radius: 18rpx;
  background: linear-gradient(180deg, #f3f4f6 0%, #e5e7eb 100%);
}

.overall-value {
  color: #ff6a00;
  font-size: 72rpx;
  font-weight: 700;
  line-height: 1;
}

.radar-wrap {
  position: relative;
  width: 100%;
  height: 660rpx;
  margin-top: 8rpx;
}

.radar-svg {
  position: absolute;
  top: 144rpx;
  left: 50%;
  width: 440rpx;
  height: 440rpx;
  transform: translateX(-50%);
}

.radar-grid {
  fill: rgb(148 163 184 / 4%);
  stroke: rgb(148 163 184 / 22%);
  stroke-width: 2;
}

.radar-grid--inner {
  fill: rgb(148 163 184 / 7%);
}

.radar-axis {
  stroke: rgb(148 163 184 / 18%);
  stroke-width: 2;
}

.radar-shape {
  fill: rgb(239 68 68 / 16%);
  stroke: #ef4444;
  stroke-width: 4;
}

.radar-dot {
  fill: #ef4444;
}

.ability-label {
  position: absolute;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  align-items: center;
  line-height: 1.1;
  text-align: center;
}

.ability-label__value {
  font-size: 30rpx;
  font-weight: 700;
}

.ability-label__name {
  color: #1e293b;
  font-size: 28rpx;
  font-weight: 700;
  white-space: nowrap;
}

.ability-label.is-orange .ability-label__value {
  color: #ff6a00;
}

.ability-label.is-amber .ability-label__value {
  color: #f7b500;
}

.ability-label.is-green .ability-label__value {
  color: #12b76a;
}

.label-top {
  top: 30rpx;
  left: 50%;
  transform: translateX(-50%);
}

.label-top-right {
  top: 164rpx;
  right: 32rpx;
}

.label-bottom-right {
  right: 38rpx;
  bottom: 164rpx;
}

.label-bottom {
  bottom: 30rpx;
  left: 50%;
  transform: translateX(-50%);
}

.label-bottom-left {
  bottom: 164rpx;
  left: 38rpx;
}

.label-top-left {
  top: 164rpx;
  left: 22rpx;
}

.position-layout {
  display: flex;
  gap: 26rpx;
  align-items: flex-start;
  margin-top: 28rpx;
}

.pitch-card {
  flex: 1;
}

.pitch-main {
  position: relative;
  height: 250rpx;
  overflow: hidden;
  border: 4rpx solid #fff;
  border-radius: 16rpx;
  background:
    radial-gradient(circle at 30% 24%, rgb(255 255 255 / 12%) 0, transparent 18%),
    radial-gradient(circle at 72% 62%, rgb(255 255 255 / 10%) 0, transparent 20%),
    repeating-linear-gradient(90deg, #7fcf2d 0, #7fcf2d 70rpx, #74c427 70rpx, #74c427 140rpx);
  box-shadow: inset 0 0 0 2rpx rgb(255 255 255 / 28%);
}

.pitch-main::before,
.pitch-main::after {
  position: absolute;
  top: 50%;
  width: 80rpx;
  height: 80rpx;
  content: '';
  border: 4rpx solid rgb(255 255 255 / 90%);
  border-radius: 50%;
  transform: translateY(-50%);
}

.pitch-main::before {
  left: -40rpx;
}

.pitch-main::after {
  right: -40rpx;
}

.pitch-line {
  position: absolute;
}

.pitch-line--vertical {
  top: 0;
  left: 50%;
  width: 4rpx;
  height: 100%;
  background: rgb(255 255 255 / 90%);
  transform: translateX(-50%);
}

.pitch-line--center-circle {
  top: 50%;
  left: 50%;
  width: 84rpx;
  height: 84rpx;
  border: 4rpx solid rgb(255 255 255 / 90%);
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.penalty-box,
.goal-box,
.goal-area {
  position: absolute;
  border: 4rpx solid rgb(255 255 255 / 90%);
}

.penalty-box {
  top: 36rpx;
  width: 84rpx;
  height: 178rpx;
}

.penalty-box--left {
  left: 24rpx;
  border-right: none;
}

.penalty-box--right {
  right: 24rpx;
  border-left: none;
}

.goal-box {
  top: 72rpx;
  width: 44rpx;
  height: 106rpx;
}

.goal-box--left {
  left: 24rpx;
  border-right: none;
}

.goal-box--right {
  right: 24rpx;
  border-left: none;
}

.goal-area {
  top: 92rpx;
  width: 18rpx;
  height: 66rpx;
}

.goal-area--left {
  left: 0;
  border-right: none;
}

.goal-area--right {
  right: 0;
  border-left: none;
}

.position-marker {
  position: absolute;
  top: 110rpx;
  right: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 58rpx;
  height: 58rpx;
  border: 4rpx solid #fff;
  border-radius: 50%;
  background: #2d5cff;
  color: #fff;
  font-size: 20rpx;
  font-weight: 700;
}

.position-copy {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  gap: 28rpx;
  width: 178rpx;
  padding-top: 10rpx;
}

.copy-item {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.copy-label {
  color: #94a3b8;
  font-size: 24rpx;
}

.copy-value {
  color: #0f172a;
  font-size: 32rpx;
  font-weight: 700;
}

.boots-row {
  display: flex;
  gap: 14rpx;
  align-items: flex-end;
  margin-top: 6rpx;
}

.boot {
  position: relative;
  width: 58rpx;
  height: 30rpx;
  border-radius: 20rpx 20rpx 8rpx 8rpx;
  background: #94a3b8;
  transform: skewX(-18deg);
  opacity: 0.95;
}

.boot::before {
  position: absolute;
  top: -8rpx;
  left: 6rpx;
  width: 26rpx;
  height: 12rpx;
  content: '';
  border-radius: 10rpx 10rpx 0 0;
  background: inherit;
}

.boot::after {
  position: absolute;
  right: -6rpx;
  bottom: 2rpx;
  width: 18rpx;
  height: 16rpx;
  content: '';
  border-radius: 10rpx 12rpx 10rpx 8rpx;
  background: inherit;
}

.boot-sole {
  position: absolute;
  right: 2rpx;
  bottom: -4rpx;
  left: 6rpx;
  height: 6rpx;
  border-radius: 999rpx;
  background: rgb(255 255 255 / 88%);
}

.boot--active {
  background: #2d5cff;
}
</style>
