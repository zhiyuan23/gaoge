<script setup>
import { Icon } from '@iconify/vue'
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { teamColors, teamData, teams } from '@/data/teams'

const router = useRouter()
const route = useRoute()

// 从路由参数获取 team，默认足球
const activeTeam = ref(route.params.team === 'basketball' ? 'warm-sunshine' : 'gaoge-fc')
const currentSlide = ref(0)

// 监听路由变化
watch(
  () => route.params.team,
  (newTeam) => {
    if (newTeam === 'basketball') {
      activeTeam.value = 'warm-sunshine'
    } else {
      activeTeam.value = 'gaoge-fc'
    }
    currentSlide.value = 0
    nextTick(() => {
      scrollToTop()
    })
  },
)

// 回到顶部
const scrollToTop = () => {
  window.scrollTo(0, 0)
  document.documentElement.scrollTop = 0
  document.body.scrollTop = 0
}

// 触摸滑动相关
const touchStartX = ref(0)
const touchEndX = ref(0)
const minSwipeDistance = 50

const currentTeamData = computed(() => teamData[activeTeam.value])

const nextSlide = () => {
  const total = currentTeamData.value.gallery.length
  currentSlide.value = (currentSlide.value + 1) % total
}

const prevSlide = () => {
  const total = currentTeamData.value.gallery.length
  currentSlide.value = (currentSlide.value - 1 + total) % total
}

const goToSlide = (index) => {
  currentSlide.value = index
}

const goBack = () => {
  router.push('/')
}

const switchTeam = (team) => {
  activeTeam.value = team.id
  currentSlide.value = 0
  scrollToTop()
  router.replace({
    params: { team: team.type === 'basketball' ? 'basketball' : 'football' },
  })
}

// 触摸滑动事件处理
const onTouchStart = (e) => {
  touchEndX.value = 0
  touchStartX.value = e.targetTouches[0].clientX
}

const onTouchMove = (e) => {
  touchEndX.value = e.targetTouches[0].clientX
}

const onTouchEnd = () => {
  const distance = touchEndX.value - touchStartX.value
  if (Math.abs(distance) > minSwipeDistance) {
    if (distance > 0) {
      prevSlide()
    } else {
      nextSlide()
    }
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#090a0d] text-white">
    <!-- Header -->
    <header
      class="fixed left-0 right-0 top-0 z-50 border-b border-white/5 bg-[#090a0d]/95 px-4 py-3 backdrop-blur-sm"
    >
      <div class="mx-auto flex max-w-6xl items-center justify-between">
        <button
          class="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 transition-all hover:bg-white/10 hover:text-white"
          @click="goBack"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span>返回</span>
        </button>
        <div class="text-sm font-bold tracking-[2px] text-white">GAOGE SPORTS</div>
        <div class="w-[70px]"></div>
      </div>
    </header>

    <!-- Team Switcher -->
    <!-- PC: left side of content area, Mobile: bottom center -->
    <div class="fixed z-40 flex gap-2 md:flex-col md:gap-3">
      <!-- Mobile: bottom center -->
      <div class="fixed bottom-4 left-1/2 flex -translate-x-1/2 gap-2 md:hidden">
        <button
          v-for="team in teams"
          :key="team.id"
          class="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl transition-all duration-300"
          :style="{
            backgroundColor:
              activeTeam === team.id ? teamColors[team.id].primary : 'rgba(255,255,255,0.08)',
            color: activeTeam === team.id ? teamColors[team.id].text : 'rgba(255,255,255,0.5)',
          }"
          :title="team.name"
          @click="switchTeam(team)"
        >
          <Icon :icon="team.icon" class="h-5 w-5" />
        </button>
      </div>
      <!-- PC: left side of content -->
      <div class="fixed left-8 top-1/2 hidden -translate-y-1/2 flex-col gap-3 md:flex">
        <button
          v-for="team in teams"
          :key="team.id"
          class="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl transition-all duration-300 md:h-12 md:w-12"
          :style="{
            backgroundColor:
              activeTeam === team.id ? teamColors[team.id].primary : 'rgba(255,255,255,0.08)',
            color: activeTeam === team.id ? teamColors[team.id].text : 'rgba(255,255,255,0.5)',
          }"
          :title="team.name"
          @click="switchTeam(team)"
        >
          <Icon :icon="team.icon" class="h-5 w-5 md:h-6 md:w-6" />
        </button>
      </div>
    </div>

    <!-- Main Content - Centered -->
    <main class="md:pb-15 relative mx-auto max-w-5xl px-4 pb-20 pt-20 md:px-16">
      <transition name="fade" mode="out-in">
        <div :key="activeTeam">
          <!-- Team Hero Image -->
          <div class="relative mb-6 h-[200px] overflow-hidden rounded-2xl md:h-[350px]">
            <img
              :src="currentTeamData.heroImage"
              :alt="currentTeamData.name"
              class="team-hero-image h-full w-full object-cover"
              :style="{ '--hero-image-offset': `${currentTeamData.heroImageOffsetX}%` }"
            />
            <div
              class="absolute inset-0 bg-gradient-to-t from-[#090a0d] via-[#090a0d]/30 to-transparent"
            ></div>
            <div
              class="absolute inset-0 bg-gradient-to-r from-[#090a0d]/60 via-transparent to-[#090a0d]/40"
            ></div>
            <div class="absolute bottom-0 left-0 right-0 p-5">
              <div class="flex items-center gap-3">
                <div
                  class="flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold md:h-14 md:w-14 md:text-xl"
                  :style="{
                    backgroundColor: teamColors[activeTeam].primary,
                    color: teamColors[activeTeam].text,
                  }"
                >
                  <Icon
                    :icon="teams.find((t) => t.id === activeTeam)?.icon || ''"
                    class="h-6 w-6 md:h-7 md:w-7"
                  />
                </div>
                <div>
                  <h1 class="text-xl font-bold md:text-2xl">{{ currentTeamData.name }}</h1>
                  <p class="text-xs text-white/50 md:text-sm">{{ currentTeamData.fullName }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Team Info -->
          <div class="mb-6 grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
            <div class="rounded-xl border border-white/5 bg-white/5 p-3">
              <p class="mb-1 text-xs uppercase tracking-wider text-white/40">成立</p>
              <p class="text-base font-semibold">{{ currentTeamData.founded }}</p>
            </div>
            <div class="rounded-xl border border-white/5 bg-white/5 p-3">
              <p class="mb-1 text-xs uppercase tracking-wider text-white/40">城市</p>
              <p class="text-base font-semibold">{{ currentTeamData.city }}</p>
            </div>
            <div class="rounded-xl border border-white/5 bg-white/5 p-3">
              <p class="mb-1 text-xs uppercase tracking-wider text-white/40">主场</p>
              <p class="text-base font-semibold">{{ currentTeamData.stadium }}</p>
            </div>
            <div class="rounded-xl border border-white/5 bg-white/5 p-3">
              <p class="mb-1 text-xs uppercase tracking-wider text-white/40">类型</p>
              <p class="text-base font-semibold">
                {{ activeTeam === 'gaoge-fc' ? '足球' : '篮球' }}
              </p>
            </div>
          </div>

          <!-- Description -->
          <div class="mb-6">
            <h2 class="mb-3 text-lg font-bold" :style="{ color: teamColors[activeTeam].primary }">
              引言
            </h2>
            <p class="text-sm leading-relaxed text-white/70 md:text-base">
              {{ currentTeamData.description }}
            </p>
          </div>

          <!-- Gallery -->
          <div class="mb-6">
            <h2 class="mb-3 text-lg font-bold" :style="{ color: teamColors[activeTeam].primary }">
              瞬间
            </h2>
            <div
              class="group relative touch-pan-y overflow-hidden rounded-2xl"
              @touchstart="onTouchStart"
              @touchmove="onTouchMove"
              @touchend="onTouchEnd"
            >
              <div class="relative aspect-[16/10]">
                <img
                  v-for="(img, index) in currentTeamData.gallery"
                  :key="index"
                  :src="img"
                  :alt="`相册 ${index + 1}`"
                  class="absolute inset-0 h-full w-full object-cover transition-all duration-500"
                  :class="index === currentSlide ? 'scale-100 opacity-100' : 'scale-105 opacity-0'"
                />
                <div
                  class="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/10"
                ></div>
                <div
                  class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"
                ></div>
              </div>

              <button
                class="absolute left-3 top-1/2 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/80 opacity-0 backdrop-blur-sm transition-all hover:bg-white/20 hover:text-white group-hover:opacity-100"
                @click="prevSlide"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <button
                class="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/80 opacity-0 backdrop-blur-sm transition-all hover:bg-white/20 hover:text-white group-hover:opacity-100"
                @click="nextSlide"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>

              <div class="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
                <button
                  v-for="(_, index) in currentTeamData.gallery"
                  :key="index"
                  class="h-1.5 w-1.5 cursor-pointer rounded-full transition-all"
                  :class="index === currentSlide ? 'w-4 bg-white' : 'bg-white/40 hover:bg-white/60'"
                  @click="goToSlide(index)"
                ></button>
              </div>
            </div>
          </div>
          <footer class="pt-6 text-center text-[11px] tracking-[0.08em] text-white/30 md:text-xs">
            <p>© 2026 GAOGE SPORTS. All rights reserved.</p>
          </footer>
        </div>
      </transition>
    </main>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.team-hero-image {
  object-position: center var(--hero-image-offset);
}

@media (width <= 767px) {
  .team-hero-image {
    object-position: center 100%;
  }
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
