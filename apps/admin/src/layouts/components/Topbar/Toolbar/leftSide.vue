<script setup lang="ts">
import { useSlots } from '@/slots'
import useSettingsStore from '@/store/modules/settings'

import Breadcrumb from './Breadcrumb/index.vue'

defineOptions({
  name: 'ToolbarLeftSide',
})

const settingsStore = useSettingsStore()
</script>

<template>
  <div class="flex items-center">
    <FaButton
      v-if="settingsStore.mode === 'mobile'"
      variant="ghost"
      size="icon"
      class="-rotate-z-180 h-9 w-9"
      @click="settingsStore.toggleSidebarCollapse()"
    >
      <FaIcon name="toolbar-collapse" class="size-4" />
    </FaButton>
    <component :is="useSlots('toolbar-start')" />
    <Breadcrumb v-if="settingsStore.settings.toolbar.breadcrumb" />
  </div>
</template>
