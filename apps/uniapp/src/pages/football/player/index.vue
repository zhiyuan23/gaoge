<script setup lang="ts">
import type { Player } from '@gaoge/shared-types'

import playerApi from '@/api/football/player'

const page = ref(0)
const pageSize = ref(100)
const total = ref(0)
const players = ref<Player[]>([])

const loadPlayers = async () => {
  const params = {
    page: page.value,
    pageSize: pageSize.value,
  }
  const data = await playerApi.list(params)
  players.value = data.list
  total.value = data.total
}

onLoad(() => {
  loadPlayers()
})
</script>

<template>
  <view class="page player-page">
    <CustomNavbar title="球员列表" />

    <view class="content">
      <view v-for="player in players" :key="player.id" class="player-card">
        <view class="player-header">
          <text class="player-number">#{{ player.playerNumber }}</text>
          <text class="player-name">{{ player.nickname }}</text>
        </view>
        <view class="player-meta">
          <text>分队：{{ player.subTeam }}</text>
          <text>状态：{{ player.status }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.player-page {
  min-height: 100vh;
  background: #f5f7fa;
}

.content {
  padding: 24rpx 24rpx 32rpx;
}

.state-card,
.summary-card,
.player-card {
  border-radius: 24rpx;
  background: #fff;
  box-shadow: 0 12rpx 32rpx rgb(15 23 42 / 6%);
}

.state-card {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  align-items: center;
  padding: 48rpx 32rpx;
  text-align: center;
}

.state-title,
.summary-title,
.player-name {
  color: #111827;
  font-size: 32rpx;
  font-weight: 600;
}

.state-desc,
.summary-count,
.player-meta {
  color: #6b7280;
  font-size: 24rpx;
}

.retry-btn {
  margin-top: 12rpx;
}

.list-wrap {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.summary-card,
.player-card {
  padding: 24rpx;
}

.summary-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.player-header,
.player-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.player-header {
  margin-bottom: 12rpx;
}

.player-number {
  color: #2563eb;
  font-size: 28rpx;
  font-weight: 700;
}
</style>
