<script setup lang="ts">
import type {
  MiniappBindOption,
  MiniappPlayerSummary,
  MiniappUpdateProfilePayload,
} from '@gaoge/shared-types'

import {
  bindFootballPlayer,
  requestBindOptions,
  updateMiniappProfile,
  uploadMiniappAvatar,
} from '@/api/auth'
import { useAuthStore } from '@/store'
import { Toast } from '@/utils'

import {
  formatBindOptionLabel,
  resolveProfileViewState,
  shouldDisableBindConfirm,
} from './profile-binding'

const authStore = useAuthStore()

const profileLoading = ref(true)
const profileError = ref('')
const profileSaving = ref(false)
const avatarUploading = ref(false)
const avatarChooseSupported = ref(false)
const bindPopupVisible = ref(false)
const bindOptionsLoading = ref(false)
const bindOptionsLoaded = ref(false)
const bindOptionsError = ref('')
const bindSubmitting = ref(false)
const selectedPlayerNumber = ref<number | null>(null)
const bindOptions = ref<MiniappBindOption[]>([])

const createEmptyPlayerForm = () => ({
  nickname: '',
  realName: '',
  subTeam: '',
  jerseyName: '',
  birthDate: '',
  position: '',
  jerseySize: '',
  remark: '',
})

const playerForm = reactive(createEmptyPlayerForm())

const me = computed(() => authStore.me)
const currentPlayer = computed(() => me.value?.player ?? null)
const profileViewState = computed(() => resolveProfileViewState(me.value))
const isBound = computed(() => profileViewState.value === 'bound')
const profileBusy = computed(() => profileSaving.value || avatarUploading.value)
const profileAvatarUrl = computed(
  () => currentPlayer.value?.avatarUrl || me.value?.user.avatarUrl || '',
)
const profileDisplayName = computed(
  () => currentPlayer.value?.nickname || me.value?.user.nickname || '我',
)
const selectedOptionLabel = computed(() => {
  const selected = bindOptions.value.find(
    (option) => option.playerNumber === selectedPlayerNumber.value,
  )

  return selected ? formatBindOptionLabel(selected) : '请选择球员号码'
})
const disableBindConfirm = computed(() =>
  shouldDisableBindConfirm(selectedPlayerNumber.value, bindSubmitting.value),
)

const syncAvatarCapability = () => {
  let supported = false

  // #ifdef MP-WEIXIN
  supported =
    typeof uni.canIUse === 'function' ? uni.canIUse('button.open-type.chooseAvatar') : true
  // #endif

  avatarChooseSupported.value = supported
}

const syncPlayerForm = (player: MiniappPlayerSummary | null) => {
  const nextState = createEmptyPlayerForm()

  if (player) {
    nextState.nickname = player.nickname
    nextState.realName = player.realName || ''
    nextState.subTeam = player.subTeam || ''
    nextState.jerseyName = player.jerseyName || ''
    nextState.birthDate = player.birthDate?.slice(0, 10) || ''
    nextState.position = player.position || ''
    nextState.jerseySize = player.jerseySize || ''
    nextState.remark = player.remark || ''
  }

  Object.assign(playerForm, nextState)
}

const ensureProfileReady = async () => {
  profileLoading.value = true
  profileError.value = ''

  try {
    await authStore.ensureSession()

    if (!authStore.me) {
      profileError.value = '加载我的信息失败，请重试'
    }
  } catch (error: any) {
    profileError.value = error?.message || '加载我的信息失败，请重试'
  } finally {
    profileLoading.value = false
  }
}

const normalizeFormText = (value: string) => {
  const normalized = value.trim()

  return normalized ? normalized : null
}

const buildPlayerProfilePayload = (): MiniappUpdateProfilePayload => ({
  nickname: playerForm.nickname.trim(),
  realName: normalizeFormText(playerForm.realName),
  subTeam: normalizeFormText(playerForm.subTeam),
  jerseyName: normalizeFormText(playerForm.jerseyName),
  birthDate: playerForm.birthDate ? `${playerForm.birthDate}T00:00:00.000Z` : null,
  position: normalizeFormText(playerForm.position),
  jerseySize: normalizeFormText(playerForm.jerseySize),
  remark: normalizeFormText(playerForm.remark),
})

const submitPlayerProfile = async () => {
  if (!currentPlayer.value || profileBusy.value) {
    return
  }

  if (!playerForm.nickname.trim()) {
    Toast('昵称不能为空')
    return
  }

  profileSaving.value = true

  try {
    const payload = await updateMiniappProfile(buildPlayerProfilePayload())

    authStore.setMe(payload)
    syncPlayerForm(payload.player)
    Toast('资料已更新', { icon: 'success' })
  } catch {
    syncPlayerForm(currentPlayer.value)
  } finally {
    profileSaving.value = false
  }
}

const uploadAvatarByPath = async (filePath: string) => {
  if (!currentPlayer.value || !filePath || avatarUploading.value) {
    return
  }

  avatarUploading.value = true

  try {
    const payload = await uploadMiniappAvatar(filePath)

    authStore.setMe(payload)
    syncPlayerForm(payload.player)
    Toast('头像已更新', { icon: 'success' })
  } catch {
    // 请求层已负责错误提示。
  } finally {
    avatarUploading.value = false
  }
}

const handleChooseAvatar = async (event: any) => {
  const filePath = event?.detail?.avatarUrl

  await uploadAvatarByPath(filePath)
}

const handleAvatarTap = async () => {
  if (!isBound.value || profileBusy.value || avatarChooseSupported.value) {
    return
  }

  try {
    const filePath = await new Promise<string>((resolve, reject) => {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const nextFilePath = res.tempFilePaths?.[0]

          if (!nextFilePath) {
            reject(new Error('未选择头像图片'))
            return
          }

          resolve(nextFilePath)
        },
        fail: reject,
      })
    })

    await uploadAvatarByPath(filePath)
  } catch (error: any) {
    if (typeof error?.errMsg === 'string' && error.errMsg.includes('cancel')) {
      return
    }

    Toast('选择头像失败')
  }
}

const handleBirthDateChange = (event: { detail?: { value?: string } }) => {
  playerForm.birthDate = event.detail?.value || ''
}

const loadBindOptions = async () => {
  bindOptionsLoading.value = true
  bindOptionsError.value = ''

  try {
    const payload = await requestBindOptions()

    bindOptions.value = payload.list
    bindOptionsLoaded.value = true
    selectedPlayerNumber.value = null
  } catch (error: any) {
    bindOptionsError.value = error?.message || '加载可绑定球员失败，请重试'
    bindOptionsLoaded.value = false
  } finally {
    bindOptionsLoading.value = false
  }
}

const openBindPopup = async () => {
  if (isBound.value) {
    return
  }

  bindPopupVisible.value = true

  if (!bindOptionsLoaded.value && !bindOptionsLoading.value) {
    await loadBindOptions()
  }
}

const closeBindPopup = () => {
  bindPopupVisible.value = false
}

const selectPlayerNumber = (playerNumber: number | null) => {
  if (playerNumber === null) {
    return
  }

  selectedPlayerNumber.value = playerNumber
}

const submitBinding = async () => {
  if (selectedPlayerNumber.value === null) {
    Toast('请先选择球员号码')
    return
  }

  bindSubmitting.value = true

  try {
    const payload = await bindFootballPlayer(selectedPlayerNumber.value)

    authStore.setMe(payload)
    syncPlayerForm(payload.player)
    closeBindPopup()
    Toast('绑定成功', { icon: 'success' })
  } catch {
    // 请求层已负责错误提示，这里只保留弹层和当前选择。
  } finally {
    bindSubmitting.value = false
  }
}

onShow(() => {
  syncAvatarCapability()
  void ensureProfileReady()
})

watch(
  currentPlayer,
  (player) => {
    syncPlayerForm(player)
  },
  { immediate: true },
)
</script>

<template>
  <view class="page profile-page">
    <view class="content">
      <view v-if="profileLoading" class="state-card">
        <text class="section-title">正在加载我的信息</text>
        <text class="state-desc">请稍候，正在同步你的登录状态和球员绑定信息。</text>
      </view>

      <view v-else-if="profileError" class="state-card">
        <text class="section-title">暂时无法获取我的信息</text>
        <text class="state-desc">{{ profileError }}</text>
        <t-button theme="primary" block @click="ensureProfileReady">重新加载</t-button>
      </view>

      <template v-else>
        <view class="profile-card">
          <button
            class="avatar-button"
            open-type="chooseAvatar"
            :disabled="!isBound || profileBusy"
            @click="handleAvatarTap"
            @chooseavatar="handleChooseAvatar"
          >
            <image
              v-if="profileAvatarUrl"
              :src="profileAvatarUrl"
              class="avatar"
              mode="aspectFill"
            />
            <view v-else class="avatar avatar-placeholder">
              {{ profileDisplayName.slice(0, 1) || '我' }}
            </view>
          </button>

          <input
            v-if="isBound"
            v-model="playerForm.nickname"
            class="nickname-input"
            type="nickname"
            :maxlength="20"
            :disabled="profileBusy"
            placeholder="点击填写昵称"
          />

          <text v-else class="nickname-display">{{ profileDisplayName }}</text>
        </view>

        <view v-if="isBound" class="binding-card">
          <text class="section-title">球员资料</text>

          <view class="field-row">
            <text class="field-label">球员号码</text>
            <text class="field-value">{{ currentPlayer?.playerNumber ?? '-' }}</text>
          </view>

          <view class="field-row">
            <text class="field-label">真实姓名</text>
            <input v-model="playerForm.realName" class="field-input" :disabled="profileBusy" />
          </view>

          <view class="field-row">
            <text class="field-label">分队</text>
            <input v-model="playerForm.subTeam" class="field-input" :disabled="profileBusy" />
          </view>

          <view class="field-row">
            <text class="field-label">球衣名称</text>
            <input v-model="playerForm.jerseyName" class="field-input" :disabled="profileBusy" />
          </view>

          <view class="field-row">
            <text class="field-label">出生日期</text>
            <picker mode="date" :value="playerForm.birthDate" @change="handleBirthDateChange">
              <view class="picker-value">{{ playerForm.birthDate || '请选择出生日期' }}</view>
            </picker>
          </view>

          <view class="field-row">
            <text class="field-label">场上位置</text>
            <input v-model="playerForm.position" class="field-input" :disabled="profileBusy" />
          </view>

          <view class="field-row">
            <text class="field-label">球衣尺码</text>
            <input v-model="playerForm.jerseySize" class="field-input" :disabled="profileBusy" />
          </view>

          <view class="field-row field-row--textarea">
            <text class="field-label">备注</text>
            <textarea
              v-model="playerForm.remark"
              class="field-textarea"
              :disabled="profileBusy"
              :maxlength="200"
            />
          </view>

          <view class="field-row">
            <text class="field-label">球员状态</text>
            <text class="field-value">{{ currentPlayer?.status ?? '-' }}</text>
          </view>

          <view class="field-row">
            <text class="field-label">管理员</text>
            <text class="field-value">{{ currentPlayer?.isAdmin ? '是' : '否' }}</text>
          </view>

          <t-button theme="primary" block :loading="profileSaving" @click="submitPlayerProfile">
            保存资料
          </t-button>
        </view>

        <view v-else class="binding-card">
          <text class="section-title">还没有绑定球员</text>
          <text class="state-desc">你还没有绑定球员，请先选择球员号码完成绑定。</text>
          <t-button theme="primary" block @click="openBindPopup">绑定球员号码</t-button>
        </view>
      </template>
    </view>

    <t-popup
      v-model:visible="bindPopupVisible"
      placement="bottom"
      round="20"
      :safe-area-inset-bottom="false"
    >
      <view class="bind-popup">
        <text class="popup-title">绑定球员号码</text>
        <text class="popup-subtitle">{{ selectedOptionLabel }}</text>

        <view v-if="bindOptionsLoading" class="popup-state">
          <text class="state-desc">正在加载可绑定球员</text>
        </view>

        <view v-else-if="bindOptionsError" class="popup-state">
          <text class="state-desc">{{ bindOptionsError }}</text>
          <t-button variant="outline" size="small" @click="loadBindOptions">重试</t-button>
        </view>

        <view v-else-if="!bindOptions.length" class="popup-state">
          <text class="state-desc">暂无可绑定球员</text>
        </view>

        <scroll-view v-else scroll-y class="option-scroll">
          <view class="option-list">
            <view
              v-for="option in bindOptions"
              :key="option.playerId"
              :class="[
                'option-card',
                { 'option-card--active': option.playerNumber === selectedPlayerNumber },
              ]"
              @click="selectPlayerNumber(option.playerNumber)"
            >
              <text class="option-label">{{ formatBindOptionLabel(option) }}</text>
              <text class="option-check">
                {{ option.playerNumber === selectedPlayerNumber ? '已选择' : '点击选择' }}
              </text>
            </view>
          </view>
        </scroll-view>

        <view class="popup-actions">
          <t-button variant="outline" block @click="closeBindPopup">取消</t-button>
          <t-button
            theme="primary"
            block
            :disabled="disableBindConfirm"
            :loading="bindSubmitting"
            @click="submitBinding"
          >
            确认绑定
          </t-button>
        </view>
      </view>
    </t-popup>
  </view>
</template>

<style scoped lang="scss">
.profile-page {
  min-height: 100vh;
  background: #f5f7fa;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  padding: 32rpx 24rpx 40rpx;
}

.profile-card,
.binding-card,
.state-card {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  padding: 32rpx;
  border-radius: 24rpx;
  background: #fff;
  box-shadow: 0 12rpx 32rpx rgb(15 23 42 / 6%);
}

.profile-card {
  align-items: center;
  text-align: center;
}

.avatar-button {
  padding: 0;
  background: transparent;
  line-height: 1;
}

.avatar-button::after {
  border: 0;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  overflow: hidden;
  border-radius: 999rpx;
}

.avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2563eb;
  font-size: 40rpx;
  font-weight: 700;
  background: #dbeafe;
}

.nickname-input,
.nickname-display {
  width: 100%;
  max-width: 420rpx;
  color: #111827;
  font-size: 32rpx;
  font-weight: 600;
  text-align: center;
}

.nickname-input {
  padding: 0 12rpx 12rpx;
  background: transparent;
  border-bottom: 2rpx solid #e5e7eb;
}

.section-title,
.popup-title,
.option-label {
  color: #111827;
  font-size: 32rpx;
  font-weight: 600;
}

.state-desc,
.popup-subtitle,
.option-check,
.field-label,
.field-value,
.picker-value {
  color: #6b7280;
  font-size: 24rpx;
  line-height: 1.6;
}

.field-row {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.field-row--textarea {
  align-items: stretch;
}

.field-input,
.field-textarea,
.picker-value {
  width: 100%;
  min-height: 72rpx;
  padding: 16rpx 20rpx;
  box-sizing: border-box;
  background: #f8fafc;
  border-radius: 16rpx;
}

.field-textarea {
  height: 160rpx;
}

.bind-popup {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  padding: 36rpx 24rpx 48rpx;
}

.popup-title,
.popup-subtitle {
  text-align: center;
}

.popup-state {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  align-items: center;
  justify-content: center;
  min-height: 220rpx;
  padding: 24rpx;
  border-radius: 20rpx;
  background: #f8fafc;
}

.option-scroll {
  max-height: 560rpx;
}

.option-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.option-card {
  display: flex;
  gap: 16rpx;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx;
  border: 2rpx solid transparent;
  border-radius: 20rpx;
  background: #f8fafc;
}

.option-card--active {
  border-color: #2563eb;
  background: #eff6ff;
}

.option-check {
  flex-shrink: 0;
  color: #2563eb;
}

.popup-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
}
</style>
