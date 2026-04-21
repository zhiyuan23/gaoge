<script setup lang="ts">
import zhCN from 'element-plus/es/locale/lang/zh-cn.mjs'

import useSettingsStore from '@/store/modules/settings'

const settingsStore = useSettingsStore()

// 跟随框架主题
const isSupprotColorMix = CSS.supports('color', 'color-mix(in srgb, #fff, #000)')
if (isSupprotColorMix) {
  document.body.style.setProperty('--el-bg-color', 'hsl(var(--background))')
  document.body.style.setProperty('--el-color-primary', 'hsl(var(--primary))')
  document.body.style.setProperty('--el-color-white', 'hsl(var(--primary-foreground))')
  document.body.style.setProperty('--el-color-black', 'hsl(var(--primary-foreground))')
}
// watch(() => settingsStore.currentColorScheme, (val) => {
//   if (val === 'light') {
//     for (let index = 1; index < 10; index++) {
//       document.body.style.setProperty(`--el-color-primary-light-${index}`, `color-mix(in hsl, hsl(var(--primary)), #fff ${index * 10}%)`)
//       document.body.style.setProperty(`--el-color-primary-dark-${index}`, `color-mix(in hsl, hsl(var(--primary)), #000 ${index * 10}%)`)
//     }
//   }
//   else {
//     for (let index = 1; index < 10; index++) {
//       document.body.style.setProperty(`--el-color-primary-light-${index}`, `color-mix(in hsl, hsl(var(--primary)), #000 ${index * 10}%)`)
//       document.body.style.setProperty(`--el-color-primary-dark-${index}`, `color-mix(in hsl, hsl(var(--primary)), #fff ${index * 10}%)`)
//     }
//   }
// }, {
//   immediate: true,
// })

watch(
  () => settingsStore.currentColorScheme,
  (val) => {
    // 修改为更接近官方的颜色混合算法
    const generateColorStep = (base: string, mix: string, percent: number) => {
      return `color-mix(in srgb, ${base}, ${mix} ${percent}%)`
    }

    if (val === 'light') {
      for (let index = 1; index < 10; index++) {
        const lightPercent = Math.min(90, 30 + index * 7) // 非线性比例
        const darkPercent = Math.min(90, index * 10)

        document.body.style.setProperty(
          `--el-color-primary-light-${index}`,
          generateColorStep('hsl(var(--primary))', '#fff', lightPercent),
        )
        document.body.style.setProperty(
          `--el-color-primary-dark-${index}`,
          generateColorStep('hsl(var(--primary))', '#000', darkPercent),
        )
      }
    } else {
      for (let index = 1; index < 10; index++) {
        const lightPercent = Math.min(90, index * 8)
        const darkPercent = Math.min(90, 20 + index * 7)

        document.body.style.setProperty(
          `--el-color-primary-light-${index}`,
          generateColorStep('hsl(var(--primary))', '#000', lightPercent),
        )
        document.body.style.setProperty(
          `--el-color-primary-dark-${index}`,
          generateColorStep('hsl(var(--primary))', '#fff', darkPercent),
        )
      }
    }
  },
  {
    immediate: true,
  },
)
</script>

<template>
  <ElConfigProvider :locale="zhCN" :button="{ autoInsertSpace: true }">
    <slot />
  </ElConfigProvider>
</template>
