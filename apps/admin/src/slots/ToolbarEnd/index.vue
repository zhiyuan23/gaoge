<script setup lang="ts">
import useSettingsStore from '@/store/settings'
import useUserStore from '@/store/user'
import eventBus from '@/utils/eventBus'

import Profile from './profile.vue'

const router = useRouter()

const settingsStore = useSettingsStore()
const userStore = useUserStore()

const isProfileShow = ref(false)
</script>

<template>
  <FaDropdown
    align="end"
    :items="[
      [
        {
          label: settingsStore.settings.home.title,
          icon: 'i-mdi:home',
          handle: () => router.push({ path: settingsStore.settings.home.fullPath }),
          hide: !settingsStore.settings.home.enable,
        },
        { label: '个人设置', icon: 'i-mdi:account', handle: () => (isProfileShow = true) },
      ],
      [
        {
          label: '快捷键介绍',
          icon: 'i-mdi:keyboard',
          handle: () => eventBus.emit('global-hotkeys-intro-toggle'),
          hide: settingsStore.mode !== 'pc',
        },
      ],
      [
        {
          label: '退出登录',
          icon: 'i-mdi:logout',
          handle: () => userStore.logout(settingsStore.settings.home.fullPath),
        },
      ],
    ]"
    class="flex-center"
  >
    <template #label>
      <div class="space-y-2">
        <div class="text-secondary-foreground/50 text-xs font-light">当前登录账号</div>
        <div class="flex-center-start gap-2">
          <FaAvatar
            :src="userStore.avatar"
            :fallback="userStore.account.slice(0, 5)"
            shape="square"
          />
          <div class="space-y-1">
            <div class="lh-none text-base">
              {{ userStore.account }}
            </div>
            <div class="text-secondary-foreground/50 text-xs font-normal">用户名</div>
          </div>
        </div>
      </div>
    </template>
    <FaButton variant="ghost" class="flex-center h-9 gap-1 px-2">
      <FaAvatar :src="userStore.avatar" class="size-6">
        <FaIcon
          name="i-carbon:user-avatar-filled-alt"
          class="text-secondary-foreground/50 size-6"
        />
      </FaAvatar>
      <template v-if="settingsStore.mode === 'pc'">
        {{ userStore.account }}
        <FaIcon name="i-ep:caret-bottom" />
      </template>
    </FaButton>
  </FaDropdown>
  <FaModal
    v-model="isProfileShow"
    align-center
    :header="false"
    :footer="false"
    :close-on-click-overlay="false"
    :close-on-press-escape="false"
    class="h-500px min-w-600px overflow-hidden"
    content-class="min-h-full p-0 flex"
  >
    <Profile />
  </FaModal>
</template>
