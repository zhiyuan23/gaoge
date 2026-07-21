<script setup lang="ts">
import useSettingsStore from '@/store/settings'

defineOptions({
  name: 'ColorScheme',
})

const settingsStore = useSettingsStore()
const isTransitioning = ref(false)
let themeTransitionSequence = 0

function cleanupLightTransition(transitionSequence: number) {
  if (transitionSequence !== themeTransitionSequence) {
    return
  }

  const root = document.documentElement
  root.classList.remove('theme-transition-to-light')
  root.style.removeProperty('--theme-transition-x')
  root.style.removeProperty('--theme-transition-y')
  isTransitioning.value = false
}

function toggleColorScheme(event: MouseEvent) {
  if (!settingsStore.currentColorScheme || isTransitioning.value) {
    return
  }

  const target = event.currentTarget as HTMLElement
  const { left, top, width, height } = target.getBoundingClientRect()
  const x = left + width / 2
  const y = top + height / 2
  const endRadius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
  const ratioX = (100 * x) / innerWidth
  const ratioY = (100 * y) / innerHeight
  const referRadius = Math.hypot(innerWidth, innerHeight) / Math.SQRT2
  const ratioRadius = (100 * endRadius) / referRadius
  const nextColorScheme = settingsStore.currentColorScheme === 'dark' ? 'light' : 'dark'
  const isDark = nextColorScheme === 'dark'
  const root = document.documentElement
  const transitionSequence = ++themeTransitionSequence
  const cleanupCurrentLightTransition = () => cleanupLightTransition(transitionSequence)

  cleanupCurrentLightTransition()
  isTransitioning.value = true

  if (!isDark) {
    root.style.setProperty('--theme-transition-x', `${ratioX}%`)
    root.style.setProperty('--theme-transition-y', `${ratioY}%`)
    root.classList.add('theme-transition-to-light')
  }

  const { startViewTransition } = useViewTransition(async () => {
    settingsStore.setColorScheme(nextColorScheme)
    await nextTick()
  })

  let transition: ReturnType<typeof startViewTransition>
  try {
    transition = startViewTransition()
  } catch {
    cleanupCurrentLightTransition()
    return
  }

  if (!transition) {
    cleanupCurrentLightTransition()
    return
  }

  transition.ready
    .then(() => {
      const clipPath = [
        `circle(0% at ${ratioX}% ${ratioY}%)`,
        `circle(${ratioRadius}% at ${ratioX}% ${ratioY}%)`,
      ]
      root.animate(
        {
          clipPath: isDark ? clipPath.toReversed() : clipPath,
        },
        {
          duration: 500,
          easing: 'ease-in-out',
          fill: 'both',
          pseudoElement: isDark ? '::view-transition-old(root)' : '::view-transition-new(root)',
        },
      )
    })
    .catch(cleanupCurrentLightTransition)

  transition.finished.finally(cleanupCurrentLightTransition).catch(() => {})
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
