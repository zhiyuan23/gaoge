<script setup>
import { Icon } from '@iconify/vue'
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import DetailButton from '@/components/DetailButton.vue'
import PageHeaderBar from '@/components/PageHeaderBar.vue'
import { teamColors, teamData, teams } from '@/data/teams'
import { fetchFootballAssetSummary, fetchFootballStandings } from '@/utils/football'

const router = useRouter()
const route = useRoute()

// 从路由参数获取 team，默认足球
const activeTeam = ref(route.params.team === 'basketball' ? 'warm-sunshine' : 'gaoge-fc')
const currentSlide = ref(0)
const seasons = ['春季赛', '夏季赛', '秋季赛', '冬季赛']
const seasonYears = [2026]
const seasonYear = ref(2026)
const seasonName = ref('春季赛')
const standingsLoading = ref(false)
const standingsError = ref('')
const assetSummary = ref({
  totalIncome: 0,
  totalExpense: 0,
  balance: 0,
})
const assetSummaryLoading = ref(false)
const assetSummaryError = ref('')
let standingsRequestSequence = 0
const standings = ref({
  season: {
    year: 2026,
    season: '春季赛',
  },
  rounds: [],
  teams: [],
})

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
const isFootballTeam = computed(() => activeTeam.value === 'gaoge-fc')
const standingRounds = computed(() => standings.value.rounds ?? [])
const standingTeams = computed(() => standings.value.teams ?? [])
const standingTeamDisplayOrder = {
  real: 0,
  inter: 1,
  united: 2,
}
const orderedStandingTeams = computed(() =>
  [...standingTeams.value].sort((leftTeam, rightTeam) => {
    const leftOrder = standingTeamDisplayOrder[leftTeam.teamCode] ?? Number.MAX_SAFE_INTEGER
    const rightOrder = standingTeamDisplayOrder[rightTeam.teamCode] ?? Number.MAX_SAFE_INTEGER

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder
    }

    return (leftTeam.teamId ?? 0) - (rightTeam.teamId ?? 0)
  }),
)
const standingTableRows = computed(() =>
  standingRounds.value.map((round, roundIndex) => ({
    id: round.id ?? `round-${roundIndex + 1}`,
    label: round.label ?? `第${round.round ?? roundIndex + 1}轮`,
    points: orderedStandingTeams.value.map((team) => team.roundPoints?.[roundIndex] ?? 0),
  })),
)
const maxStandingPoints = computed(() =>
  Math.max(1, ...orderedStandingTeams.value.map((team) => team.totalPoints ?? 0)),
)
const standingTeamAccents = {
  real: {
    border: 'rgba(245, 158, 11, 0.32)',
    glow: 'rgba(245, 158, 11, 0.18)',
    fill: '#f59e0b',
  },
  inter: {
    border: 'rgba(59, 130, 246, 0.32)',
    glow: 'rgba(59, 130, 246, 0.18)',
    fill: '#3b82f6',
  },
  united: {
    border: 'rgba(239, 68, 68, 0.32)',
    glow: 'rgba(239, 68, 68, 0.18)',
    fill: '#ef4444',
  },
}

// const getStandingTeamTrophyCount = (team) =>
//   team.roundPoints?.filter((point) => point === 2).length ?? 0
// const leadingStandingTeamCode = computed(() => {
//   const [leader, runnerUp] = [...orderedStandingTeams.value].sort((leftTeam, rightTeam) => {
//     if ((rightTeam.totalPoints ?? 0) !== (leftTeam.totalPoints ?? 0)) {
//       return (rightTeam.totalPoints ?? 0) - (leftTeam.totalPoints ?? 0)
//     }

//     return getStandingTeamTrophyCount(rightTeam) - getStandingTeamTrophyCount(leftTeam)
//   })

//   if (!leader) {
//     return ''
//   }

//   if (!runnerUp) {
//     return leader.teamCode
//   }

//   const leaderPoints = leader.totalPoints ?? 0
//   const runnerUpPoints = runnerUp.totalPoints ?? 0
//   const leaderTrophies = getStandingTeamTrophyCount(leader)
//   const runnerUpTrophies = getStandingTeamTrophyCount(runnerUp)

//   if (leaderPoints === runnerUpPoints && leaderTrophies === runnerUpTrophies) {
//     return ''
//   }

//   return leader.teamCode
// })

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

const switchTeam = (team) => {
  activeTeam.value = team.id
  currentSlide.value = 0
  scrollToTop()
  router.replace({
    params: { team: team.type === 'basketball' ? 'basketball' : 'football' },
  })
}

const loadStandings = async () => {
  const requestSequence = ++standingsRequestSequence

  if (!isFootballTeam.value) {
    standingsError.value = ''
    standingsLoading.value = false
    standings.value = {
      season: {
        year: seasonYear.value,
        season: seasonName.value,
      },
      rounds: [],
      teams: [],
    }
    return
  }

  standingsLoading.value = true
  standingsError.value = ''

  try {
    const payload = await fetchFootballStandings({
      year: seasonYear.value,
      season: seasonName.value,
    })

    if (requestSequence !== standingsRequestSequence) {
      return
    }

    standings.value = {
      season: payload.season ?? {
        year: seasonYear.value,
        season: seasonName.value,
      },
      rounds: payload.rounds ?? [],
      teams: payload.teams ?? [],
    }
  } catch (error) {
    if (requestSequence !== standingsRequestSequence) {
      return
    }

    standingsError.value = error instanceof Error ? error.message : '积分加载失败'
    standings.value = {
      season: {
        year: seasonYear.value,
        season: seasonName.value,
      },
      rounds: [],
      teams: [],
    }
  } finally {
    if (requestSequence === standingsRequestSequence) {
      standingsLoading.value = false
    }
  }
}

const formatCurrencyFromCent = (amount) =>
  `¥${(amount / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

const loadAssetSummary = async () => {
  if (!isFootballTeam.value) {
    assetSummary.value = {
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
    }
    assetSummaryError.value = ''
    assetSummaryLoading.value = false
    return
  }

  assetSummaryLoading.value = true
  assetSummaryError.value = ''

  try {
    assetSummary.value = await fetchFootballAssetSummary()
  } catch (error) {
    assetSummaryError.value = error instanceof Error ? error.message : '资产总览加载失败'
  } finally {
    assetSummaryLoading.value = false
  }
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

watch([isFootballTeam, seasonYear, seasonName], loadStandings, {
  immediate: true,
})

watch(isFootballTeam, loadAssetSummary, {
  immediate: true,
})
</script>

<template>
  <div class="min-h-screen bg-[#090a0d] text-white">
    <PageHeaderBar back-to="/" />

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
          <div class="h-50 md:h-87.5 relative mb-6 overflow-hidden rounded-2xl">
            <img
              :src="currentTeamData.heroImage"
              :alt="currentTeamData.name"
              class="team-hero-image h-full w-full object-cover"
              :style="{ '--hero-image-offset': `${currentTeamData.heroImageOffsetX}%` }"
            />
            <div
              class="bg-linear-to-t absolute inset-0 from-[#090a0d] via-[#090a0d]/30 to-transparent"
            ></div>
            <div
              class="bg-linear-to-r absolute inset-0 from-[#090a0d]/60 via-transparent to-[#090a0d]/40"
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

          <section
            v-if="isFootballTeam"
            class="border-white/8 mb-6 rounded-3xl border bg-white/5 p-4 md:p-6"
          >
            <div class="mb-5 flex items-start justify-between gap-3">
              <div class="min-w-0 flex-1">
                <h2 class="text-lg font-bold" :style="{ color: teamColors[activeTeam].primary }">
                  球队资产
                </h2>
                <p class="mt-2 text-sm text-white/55">公开球队当前收支总览与历史明细。</p>
              </div>
              <DetailButton
                :accent-color="teamColors[activeTeam].primary"
                :accent-text-color="teamColors[activeTeam].text"
                label="查看明细"
                to="/teams/football/assets"
              />
            </div>

            <div v-if="assetSummaryLoading" class="text-sm text-white/55">资产总览加载中...</div>
            <div v-else-if="assetSummaryError" class="text-sm text-rose-200">
              资产总览加载失败：{{ assetSummaryError }}
            </div>
            <div v-else class="grid grid-cols-3 gap-2 md:gap-3">
              <div class="border-white/8 min-w-0 rounded-2xl border bg-[#0f1117] p-3">
                <p class="text-[11px] text-white/40 md:text-xs">总收入</p>
                <p class="mt-2 text-lg font-semibold leading-tight text-emerald-300 md:text-xl">
                  {{ formatCurrencyFromCent(assetSummary.totalIncome) }}
                </p>
              </div>
              <div class="border-white/8 min-w-0 rounded-2xl border bg-[#0f1117] p-3">
                <p class="text-[11px] text-white/40 md:text-xs">总支出</p>
                <p class="mt-2 text-lg font-semibold leading-tight text-rose-300 md:text-xl">
                  {{ formatCurrencyFromCent(assetSummary.totalExpense) }}
                </p>
              </div>
              <div class="border-white/8 min-w-0 rounded-2xl border bg-[#0f1117] p-3">
                <p class="text-[11px] text-white/40 md:text-xs">当前结余</p>
                <p class="mt-2 text-lg font-semibold leading-tight text-sky-300 md:text-xl">
                  {{ formatCurrencyFromCent(assetSummary.balance) }}
                </p>
              </div>
            </div>
          </section>

          <section
            v-if="isFootballTeam"
            class="border-white/8 mb-6 rounded-3xl border bg-white/5 p-4 md:p-6"
          >
            <div class="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 class="text-lg font-bold" :style="{ color: teamColors[activeTeam].primary }">
                  赛季积分榜
                </h2>
                <p class="mt-2 text-sm text-white/55">按赛季查看三支球队积分对比与每轮明细。</p>
              </div>
              <div v-if="false" class="grid grid-cols-2 gap-3 md:w-auto">
                <label
                  class="flex flex-col gap-2 text-xs uppercase tracking-[0.14em] text-white/40"
                >
                  年份
                  <select
                    v-model.number="seasonYear"
                    class="rounded-2xl border border-white/10 bg-[#11131a] px-4 py-3 text-sm tracking-normal text-white outline-none transition focus:border-white/25"
                  >
                    <option v-for="year in seasonYears" :key="year" :value="year">
                      {{ year }}
                    </option>
                  </select>
                </label>
                <label
                  class="flex flex-col gap-2 text-xs uppercase tracking-[0.14em] text-white/40"
                >
                  赛段
                  <select
                    v-model="seasonName"
                    class="rounded-2xl border border-white/10 bg-[#11131a] px-4 py-3 text-sm tracking-normal text-white outline-none transition focus:border-white/25"
                  >
                    <option v-for="season in seasons" :key="season" :value="season">
                      {{ season }}
                    </option>
                  </select>
                </label>
              </div>
            </div>

            <div
              v-if="standingsLoading"
              class="border-white/8 rounded-2xl border bg-[#0f1117] px-4 py-10 text-center text-sm text-white/55"
            >
              积分榜加载中...
            </div>

            <div
              v-else-if="standingsError"
              class="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-6"
            >
              <p class="text-sm text-red-100">积分加载失败：{{ standingsError }}</p>
              <button
                class="border-white/12 bg-white/8 hover:bg-white/12 mt-4 rounded-full border px-4 py-2 text-sm text-white transition"
                @click="loadStandings"
              >
                重试
              </button>
            </div>

            <div
              v-else-if="!standingRounds.length"
              class="rounded-2xl border border-dashed border-white/10 bg-[#0f1117] px-4 py-10 text-center"
            >
              <p class="text-white/72 text-sm font-medium">暂无比赛数据</p>
              <p class="text-white/42 mt-2 text-xs tracking-[0.08em]">
                录入首轮比赛后，这里会展示 3 支球队的累计积分走势与总计。
              </p>
            </div>

            <div v-else class="space-y-5">
              <div>
                <div class="grid grid-cols-3 gap-2 md:gap-3">
                  <article
                    v-for="team in orderedStandingTeams"
                    :key="team.teamId"
                    class="overflow-hidden rounded-2xl border px-3 py-3 md:p-4"
                    :style="{
                      borderColor:
                        standingTeamAccents[team.teamCode]?.border || 'rgba(255,255,255,0.1)',
                      background: `linear-gradient(135deg, ${
                        standingTeamAccents[team.teamCode]?.glow || 'rgba(255,255,255,0.08)'
                      }, rgba(255,255,255,0.03))`,
                    }"
                  >
                    <div class="flex items-start justify-between gap-3">
                      <div class="min-w-0">
                        <p class="text-[10px] uppercase tracking-[0.12em] text-white/45 md:text-xs">
                          {{ team.teamCode }}
                        </p>
                        <h4
                          class="mt-2 whitespace-nowrap text-[14px] font-semibold text-white md:text-lg"
                        >
                          {{ team.teamName }}
                        </h4>
                      </div>
                      <div class="text-right">
                        <div
                          class="relative items-end justify-end gap-1 px-1 text-2xl font-black leading-none text-white md:text-3xl"
                        >
                          <!-- <Icon
                            v-if="team.teamCode === leadingStandingTeamCode"
                            icon="mdi:crown"
                            class="text-amber-200/12 absolute left-1/2 top-1/2 h-[200%] w-[200%] -translate-x-1/2 -translate-y-1/2"
                          /> -->
                          <span class="relative">{{ team.totalPoints }}</span>
                        </div>
                      </div>
                    </div>
                    <!-- <div
                      v-if="getStandingTeamTrophyCount(team)"
                      class="mt-3 flex justify-end gap-1.5 text-amber-300"
                    >
                      <Icon
                        v-for="trophyIndex in getStandingTeamTrophyCount(team)"
                        :key="`${team.teamId}-trophy-${trophyIndex}`"
                        icon="mdi:trophy"
                        class="h-4 w-4"
                      />
                    </div> -->
                    <div class="bg-white/8 mt-2.5 h-2 overflow-hidden rounded-full">
                      <div
                        class="h-full rounded-full transition-all duration-500"
                        :style="{
                          width: `${(team.totalPoints / maxStandingPoints) * 100}%`,
                          backgroundColor:
                            standingTeamAccents[team.teamCode]?.fill ||
                            teamColors[activeTeam].primary,
                        }"
                      ></div>
                    </div>
                  </article>
                </div>
              </div>

              <div class="border-white/8 overflow-hidden rounded-2xl border bg-[#0f1117]">
                <div class="overflow-x-auto">
                  <table class="min-w-full text-left text-sm text-white/80">
                    <thead class="bg-white/3 text-xs uppercase tracking-[0.14em] text-white/40">
                      <tr>
                        <th class="px-4 py-3 font-medium">轮次</th>
                        <th
                          v-for="team in orderedStandingTeams"
                          :key="team.teamId"
                          class="px-4 py-3 text-center font-medium"
                        >
                          {{ team.teamName }}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="row in standingTableRows"
                        :key="row.id"
                        class="border-white/6 border-t"
                      >
                        <th class="px-4 py-4 font-semibold text-white">{{ row.label }}</th>
                        <td
                          v-for="(point, pointIndex) in row.points"
                          :key="`${row.id}-${pointIndex}`"
                          class="text-white/72 px-4 py-4 text-center"
                        >
                          <span
                            v-if="point === 2"
                            class="relative inline-flex h-8 w-8 items-center justify-center text-[11px] font-semibold text-amber-50"
                          >
                            <Icon
                              icon="mdi:trophy"
                              class="text-amber-200/12 absolute inset-0 h-full w-full translate-y-0.5"
                            />
                            <span class="relative">{{ point }}</span>
                          </span>
                          <span v-else>
                            {{ point }}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                    <tfoot class="border-white/8 bg-white/2 border-t">
                      <tr>
                        <th class="px-4 py-4 font-semibold text-white">总积分</th>
                        <td
                          v-for="team in orderedStandingTeams"
                          :key="`total-${team.teamId}`"
                          class="px-4 py-4 text-center font-semibold text-white"
                        >
                          {{ team.totalPoints }}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </section>

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
              <div class="aspect-16/10 relative">
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
                  class="bg-linear-to-t absolute inset-0 from-black/40 via-transparent to-transparent"
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
