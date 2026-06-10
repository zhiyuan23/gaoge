# Miniapp Profile Binding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement football player binding on `apps/miniapp` profile page so unbound users can choose a player number and bind in-place, while bound users see their linked player information immediately.

**Architecture:** Keep `/miniapp/me` as the single source of truth via `authStore.me`, add a small store method for safe `me` updates, and move page-only view-state helpers into a focused `profile-binding` module that can be exercised with Node built-in tests before wiring the UI. The page stays single-file, owns popup/request state locally, and reuses existing auth APIs without changing backend contracts.

**Tech Stack:** Vue 3 `<script setup>`, uni-app, Pinia, TDesign UniApp, Node built-in `node:test`, workspace shared types

---

## File Structure

### Profile binding view-state helper

- Create: `apps/miniapp/src/pages/profile/profile-binding.ts`
- Create: `apps/miniapp/scripts/profile-binding.test.mjs`

### Auth store state update entry

- Modify: `apps/miniapp/src/store/auth/index.ts`

### Profile page UI and interaction

- Modify: `apps/miniapp/src/pages/profile/index.vue`

## Task 1: Add profile binding helper with red-green coverage

**Files:**

- Create: `apps/miniapp/src/pages/profile/profile-binding.ts`
- Test: `apps/miniapp/scripts/profile-binding.test.mjs`

- [ ] **Step 1: Write the failing helper test for state derivation and option formatting**

```js
import test from 'node:test'
import assert from 'node:assert/strict'

import {
  formatBindOptionLabel,
  resolveProfileViewState,
  shouldDisableBindConfirm,
} from '../src/pages/profile/profile-binding.ts'

test('returns loading before me payload arrives', () => {
  assert.equal(resolveProfileViewState(null), 'loading')
})

test('returns bound only when user and binding are both present', () => {
  assert.equal(
    resolveProfileViewState({
      user: { isBound: true },
      binding: { playerNumber: 7 },
    }),
    'bound',
  )
})

test('returns unbound when current user is not linked', () => {
  assert.equal(
    resolveProfileViewState({
      user: { isBound: false },
      binding: null,
    }),
    'unbound',
  )
})

test('formats bind option labels with optional sub team', () => {
  assert.equal(
    formatBindOptionLabel({
      playerId: 12,
      playerNumber: 7,
      nickname: '齐达内',
      subTeam: 'real',
    }),
    '#7 齐达内 · real',
  )

  assert.equal(
    formatBindOptionLabel({
      playerId: 13,
      playerNumber: 9,
      nickname: '贝巴',
      subTeam: null,
    }),
    '#9 贝巴',
  )
})

test('disables confirm when selection is empty or submit is in flight', () => {
  assert.equal(shouldDisableBindConfirm(null, false), true)
  assert.equal(shouldDisableBindConfirm(7, false), false)
  assert.equal(shouldDisableBindConfirm(7, true), true)
})
```

- [ ] **Step 2: Run the focused helper test and confirm it fails first**

Run:

```bash
node --test apps/miniapp/scripts/profile-binding.test.mjs
```

Expected: FAIL because `profile-binding.ts` does not exist yet.

- [ ] **Step 3: Implement the minimal helper module consumed by the page**

```ts
import type { MiniappBindOption, MiniappMeResponse } from '@gaoge/shared-types'

export type ProfileViewState = 'loading' | 'bound' | 'unbound'

export const resolveProfileViewState = (
  me: Pick<MiniappMeResponse, 'user' | 'binding'> | null,
): ProfileViewState => {
  if (!me) {
    return 'loading'
  }

  return me.user.isBound && me.binding ? 'bound' : 'unbound'
}

export const formatBindOptionLabel = (option: MiniappBindOption) => {
  const numberLabel = option.playerNumber ?? '-'
  const teamSuffix = option.subTeam ? ` · ${option.subTeam}` : ''

  return `#${numberLabel} ${option.nickname}${teamSuffix}`
}

export const shouldDisableBindConfirm = (
  selectedPlayerNumber: number | null,
  submitting: boolean,
) => selectedPlayerNumber === null || submitting
```

- [ ] **Step 4: Re-run the helper test and confirm it passes**

Run:

```bash
node --test apps/miniapp/scripts/profile-binding.test.mjs
```

Expected: PASS with all helper assertions green.

## Task 2: Add a safe `me` update method to `authStore`

**Files:**

- Modify: `apps/miniapp/src/store/auth/index.ts`

- [ ] **Step 1: Extend the store API with a dedicated `setMe` method**

```ts
const setMe = (payload: MiniappMeResponse | null) => {
  me.value = payload
}
```

- [ ] **Step 2: Reuse `setMe` inside existing store flows instead of direct `me.value = ...` writes**

```ts
const setSession = (payload: MiniappLoginResponse) => {
  accessToken.value = payload.accessToken
  refreshToken.value = payload.refreshToken
  setMe({
    user: payload.user,
    binding: payload.binding,
  })

  storage.set('accessToken', payload.accessToken)
  storage.set('refreshToken', payload.refreshToken)
}

const fetchMe = async () => {
  const payload = await requestMe()

  setMe(payload)

  return payload
}
```

- [ ] **Step 3: Export the new method from the store return object**

```ts
return {
  accessToken,
  refreshToken,
  me,
  bootstrapping,
  setMe,
  setSession,
  silentLogin,
  fetchMe,
  ensureSession,
  logout,
}
```

## Task 3: Implement profile page loading, bound/unbound UI, and bind popup flow

**Files:**

- Modify: `apps/miniapp/src/pages/profile/index.vue`

- [ ] **Step 1: Add page-local state for popup visibility, candidate loading, retry, selection, and submit status**

```ts
const bindPopupVisible = ref(false)
const bindOptionsLoading = ref(false)
const bindOptionsLoaded = ref(false)
const bindOptionsError = ref('')
const bindSubmitting = ref(false)
const selectedPlayerNumber = ref<number | null>(null)
const bindOptions = ref<MiniappBindOption[]>([])
```

- [ ] **Step 2: Add computed state from `authStore.me` through the helper module**

```ts
const me = computed(() => authStore.me)
const profileViewState = computed(() => resolveProfileViewState(me.value))
const isBound = computed(() => profileViewState.value === 'bound')
const selectedOptionLabel = computed(() => {
  const selected = bindOptions.value.find(
    (option) => option.playerNumber === selectedPlayerNumber.value,
  )

  return selected ? formatBindOptionLabel(selected) : '请选择球员号码'
})
const disableBindConfirm = computed(() =>
  shouldDisableBindConfirm(selectedPlayerNumber.value, bindSubmitting.value),
)
```

- [ ] **Step 3: Implement page bootstrap and candidate list fetch flow**

```ts
const ensureProfileReady = async () => {
  await authStore.ensureSession()
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
  } finally {
    bindOptionsLoading.value = false
  }
}

onShow(() => {
  void ensureProfileReady()
})
```

- [ ] **Step 4: Implement popup open/close/select/submit handlers with local validation**

```ts
const openBindPopup = async () => {
  bindPopupVisible.value = true

  if (!bindOptionsLoaded.value) {
    await loadBindOptions()
  }
}

const closeBindPopup = () => {
  bindPopupVisible.value = false
}

const selectPlayerNumber = (playerNumber: number | null) => {
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
    closeBindPopup()
    Toast('绑定成功', { icon: 'success' })
  } finally {
    bindSubmitting.value = false
  }
}
```

- [ ] **Step 5: Replace the current placeholder card with loading, bound, unbound, and popup markup**

```vue
<view v-if="profileViewState === 'loading'" class="state-card">
  <text class="state-title">正在加载我的信息</text>
  <text class="state-desc">请稍候，正在同步你的登录状态和球员绑定信息</text>
</view>

<view v-else class="content">
  <view class="profile-card">
    <image v-if="me?.user.avatarUrl" :src="me.user.avatarUrl" class="avatar" mode="aspectFill" />
    <view v-else class="avatar avatar-placeholder">{{ me?.user.nickname?.slice(0, 1) || '我' }}</view>
    <text class="section-title">{{ isBound ? '已绑定球员' : '未绑定球员' }}</text>
    <text class="info-text">openid：{{ me?.user.openid || '-' }}</text>
    <text class="info-text">昵称：{{ me?.user.nickname || '-' }}</text>
  </view>

  <view v-if="isBound" class="binding-card">
    <text class="section-title">球员信息</text>
    <text class="info-text">号码：{{ me?.binding?.playerNumber ?? '-' }}</text>
    <text class="info-text">昵称：{{ me?.binding?.nickname ?? '-' }}</text>
    <text class="info-text">分队：{{ me?.binding?.subTeam ?? '-' }}</text>
    <text class="info-text">状态：{{ me?.binding?.status ?? '-' }}</text>
  </view>

  <view v-else class="binding-card">
    <text class="section-title">还没有绑定球员</text>
    <text class="state-desc">你还没有绑定球员，请先选择球员号码完成绑定。</text>
    <t-button theme="primary" block @click="openBindPopup">绑定球员号码</t-button>
  </view>
</view>

<t-popup :show="bindPopupVisible" round="20" placement="bottom" @close="closeBindPopup">
  <!-- popup body -->
</t-popup>
```

- [ ] **Step 6: Fill the popup body for loading, error, empty, and selectable options**

```vue
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

  <view v-else class="option-list">
    <view
      v-for="option in bindOptions"
      :key="option.playerId"
      :class="['option-card', { 'option-card--active': option.playerNumber === selectedPlayerNumber }]"
      @click="selectPlayerNumber(option.playerNumber)"
    >
      <text class="option-label">{{ formatBindOptionLabel(option) }}</text>
      <text class="option-check">{{ option.playerNumber === selectedPlayerNumber ? '已选择' : '点击选择' }}</text>
    </view>
  </view>

  <view class="popup-actions">
    <t-button variant="outline" block @click="closeBindPopup">取消</t-button>
    <t-button :disabled="disableBindConfirm" :loading="bindSubmitting" theme="primary" block @click="submitBinding">
      确认绑定
    </t-button>
  </view>
</view>
```

- [ ] **Step 7: Add focused page styles for cards, popup, and selected state**

```scss
.profile-page {
  min-height: 100vh;
  background: #f5f7fa;
}

.content,
.bind-popup,
.option-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.profile-card,
.binding-card,
.option-card,
.state-card {
  border-radius: 24rpx;
  background: #fff;
  box-shadow: 0 12rpx 32rpx rgb(15 23 42 / 6%);
}

.option-card--active {
  border: 2rpx solid #2563eb;
  background: #eff6ff;
}
```

## Task 4: Verify helper behavior and miniapp typing after integration

**Files:**

- Verify: `apps/miniapp/scripts/profile-binding.test.mjs`
- Verify: `apps/miniapp/src/pages/profile/index.vue`
- Verify: `apps/miniapp/src/store/auth/index.ts`

- [ ] **Step 1: Run the helper test again after page wiring**

Run:

```bash
node --test apps/miniapp/scripts/profile-binding.test.mjs
```

Expected: PASS, confirming the extracted page rules still behave as intended after integration.

- [ ] **Step 2: Run the miniapp typecheck required by the spec**

Run:

```bash
pnpm --filter @gaoge/app-miniapp typecheck
```

Expected: PASS with no type errors in the updated profile page, helper, or auth store.

- [ ] **Step 3: Re-read the spec acceptance list against the final code**

Checklist:

```text
[ ] “我的”页展示当前登录用户信息
[ ] 已绑定态展示球员信息
[ ] 未绑定态可在当前页打开弹层
[ ] 只能选择后端返回的号码
[ ] 绑定成功后立即切换为已绑定态
[ ] 空列表、加载失败、未选择号码、绑定失败都有明确反馈
```
