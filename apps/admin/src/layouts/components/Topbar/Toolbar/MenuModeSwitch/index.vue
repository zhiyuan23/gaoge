<script setup lang="ts">
import useMenuStore from '@/store/menu'
import useSettingsStore from '@/store/settings'

defineOptions({
  name: 'MenuModeSwitch',
})

const route = useRoute()
const settingsStore = useSettingsStore()
const menuStore = useMenuStore()

const isHeadMode = computed(() => settingsStore.settings.menu.mode === 'head')
const ariaLabel = computed(() => (isHeadMode.value ? '切换为无主导航模式' : '切换为顶部导航模式'))
const icon = computed(() =>
  isHeadMode.value ? 'i-gala:sidebar-left' : 'i-codicon:layout-sidebar-left-off',
)

function toggleMenuMode() {
  const nextMode = isHeadMode.value ? 'single' : 'head'
  settingsStore.settings.menu.mode = nextMode
  menuStore.setActived(nextMode === 'single' ? 0 : route.fullPath)
}
</script>

<template>
  <FaButton variant="ghost" size="icon" :aria-label="ariaLabel" @click="toggleMenuMode">
    <FaIcon :name="icon" class="size-4" />
  </FaButton>
</template>
