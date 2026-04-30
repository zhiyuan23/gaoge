<script setup lang="ts">
import useSettingsStore from '@/store/settings'

defineOptions({
  name: 'ColorScheme',
})

const settingsStore = useSettingsStore()

function toggleColorScheme(event: MouseEvent) {
  if (!settingsStore.currentColorScheme) {
    return
  }

  const nextColorScheme = settingsStore.currentColorScheme === 'dark' ? 'light' : 'dark'
  const isDark = nextColorScheme === 'dark'
  const { startViewTransition } = useViewTransition(() => {
    settingsStore.setColorScheme(nextColorScheme)
  })
  startViewTransition()?.ready.then(() => {
    const x = event.clientX
    const y = event.clientY
    const endRadius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
    const startClipPath = `circle(0px at ${x}px ${y}px)`
    const endClipPath = `circle(${endRadius}px at ${x}px ${y}px)`
    document.documentElement.animate(
      {
        clipPath: isDark ? [endClipPath, startClipPath] : [startClipPath, endClipPath],
      },
      {
        duration: 300,
        easing: 'ease-out',
        fill: 'forwards',
        pseudoElement: isDark ? '::view-transition-old(root)' : '::view-transition-new(root)',
      },
    )
  })
}
</script>

<template>
  <FaButton variant="ghost" size="icon" @click="toggleColorScheme">
    <FaIcon
      :name="
        {
          light: 'i-ri:sun-line',
          dark: 'i-ri:moon-line',
        }[settingsStore.currentColorScheme!]
      "
      class="size-4"
    />
  </FaButton>
</template>
