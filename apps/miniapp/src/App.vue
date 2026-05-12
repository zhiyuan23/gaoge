<script setup lang="ts">
import { useAppStore, useAuthStore } from '@/store'

onLaunch(async () => {
  useAppStore().initSystemInfo()
  await useAuthStore().ensureSession()
})

onShow(() => {
  console.log('App Show')
})

onHide(() => {
  console.log('App Hide')
})
</script>

<style lang="scss">
/* 每个页面公共css */
@import '@/static/styles/common.scss';
</style>
