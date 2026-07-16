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

  const x = event.clientX
  const y = event.clientY
  const endRadius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
  const root = document.documentElement
  const nextColorScheme = settingsStore.currentColorScheme === 'dark' ? 'light' : 'dark'
  const isDark = nextColorScheme === 'dark'

  root.style.setProperty('--theme-transition-x', `${x}px`)
  root.style.setProperty('--theme-transition-y', `${y}px`)
  root.style.setProperty('--theme-transition-radius', `${endRadius}px`)
  root.classList.add(`theme-transition-to-${nextColorScheme}`)

  const { startViewTransition } = useViewTransition(() => {
    settingsStore.setColorScheme(nextColorScheme)
  })

  const transition = startViewTransition()
  if (!transition) {
    cleanupThemeTransition()
    return
  }

  transition.ready
    .then(() => {
      const startClipPath = `circle(0px at ${x}px ${y}px)`
      const endClipPath = `circle(${endRadius}px at ${x}px ${y}px)`
      document.documentElement.animate(
        {
          clipPath: isDark ? [endClipPath, startClipPath] : [startClipPath, endClipPath],
        },
        {
          duration: 500,
          easing: 'ease-in',
          fill: 'forwards',
          pseudoElement: isDark ? '::view-transition-old(root)' : '::view-transition-new(root)',
        },
      )
    })
    .catch(cleanupThemeTransition)

  transition.finished.finally(cleanupThemeTransition).catch(() => {})
}

function cleanupThemeTransition() {
  const root = document.documentElement
  root.classList.remove('theme-transition-to-light', 'theme-transition-to-dark')
  root.style.removeProperty('--theme-transition-x')
  root.style.removeProperty('--theme-transition-y')
  root.style.removeProperty('--theme-transition-radius')
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
