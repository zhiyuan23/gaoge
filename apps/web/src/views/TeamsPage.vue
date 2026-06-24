<script setup>
import { Icon } from '@iconify/vue'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
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
const defaultStandingRoundCount = 10
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
const activeTeamPrimaryColor = computed(() => teamColors[activeTeam.value].primary)
const standingRounds = computed(() => standings.value.rounds ?? [])
const standingTeams = computed(() => standings.value.teams ?? [])
const defaultStandingTeams = [
  { teamId: 1, teamCode: 'real', teamName: '皇家高歌', totalPoints: 0, roundPoints: [] },
  { teamId: 2, teamCode: 'inter', teamName: '高歌国际', totalPoints: 0, roundPoints: [] },
  { teamId: 3, teamCode: 'united', teamName: '高歌联', totalPoints: 0, roundPoints: [] },
]
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
const displayedStandingTeams = computed(() =>
  orderedStandingTeams.value.length ? orderedStandingTeams.value : defaultStandingTeams,
)
const standingTableRows = computed(() =>
  Array.from(
    { length: Math.max(defaultStandingRoundCount, standingRounds.value.length) },
    (_, index) => {
      const round = standingRounds.value[index]

      return {
        id: round?.id ?? `round-placeholder-${index + 1}`,
        label: round?.label ?? `第${round?.round ?? index + 1}轮`,
        points: displayedStandingTeams.value.map((team) =>
          round ? (team.roundPoints?.[index] ?? 0) : null,
        ),
      }
    },
  ),
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
const standingTeamLogos = {
  real: {
    icon: 'game-icons:lion',
    label: '狮子',
    color: '#f59e0b',
  },
  inter: {
    icon: 'game-icons:eagle-emblem',
    label: '展翅的雄鹰',
    color: '#3b82f6',
  },
  united: {
    icon: 'game-icons:wolf-head',
    label: '仰天长啸的狼',
    color: '#ef4444',
    iconClass: 'scale-x-[-1]',
  },
}
const standingPointIcons = {
  2: {
    icon: 'mdi:white-balance-sunny',
    label: '冠军太阳',
    color: 'text-amber-200',
    background: 'bg-amber-400/10',
    border: 'border-amber-300/20',
  },
  1: {
    icon: 'mdi:moon-waning-crescent',
    label: '亚军月亮',
    color: 'text-sky-200',
    background: 'bg-sky-400/10',
    border: 'border-sky-300/20',
  },
  0: {
    icon: 'mdi:star-four-points-outline',
    label: '季军星星',
    color: 'text-rose-200',
    background: 'bg-rose-400/10',
    border: 'border-rose-300/20',
  },
}

const getStandingTeamLogo = (teamCode) => standingTeamLogos[teamCode] ?? standingTeamLogos.real

const getStandingPointIcon = (point) => standingPointIcons[point] ?? null

const hexToRgba = (hexColor, alpha) => {
  const normalizedHex = hexColor.replace('#', '')
  const safeHex =
    normalizedHex.length === 3
      ? normalizedHex
          .split('')
          .map((char) => char + char)
          .join('')
      : normalizedHex

  const red = Number.parseInt(safeHex.slice(0, 2), 16)
  const green = Number.parseInt(safeHex.slice(2, 4), 16)
  const blue = Number.parseInt(safeHex.slice(4, 6), 16)

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

const isActiveSeason = (season) => seasonName.value === season

const selectSeason = (season) => {
  if (seasonName.value === season) {
    return
  }

  seasonName.value = season
}

const getSeasonTabStyle = (season) => {
  if (!isActiveSeason(season)) {
    return {}
  }

  return {
    borderColor: hexToRgba(activeTeamPrimaryColor.value, 0.4),
    background: `linear-gradient(180deg, ${hexToRgba(activeTeamPrimaryColor.value, 0.2)}, ${hexToRgba(activeTeamPrimaryColor.value, 0.1)})`,
    boxShadow: `0 0 20px ${hexToRgba(activeTeamPrimaryColor.value, 0.16)}, inset 0 1px 0 rgba(255,255,255,0.08)`,
    color: 'rgba(255,255,255,0.96)',
  }
}

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
  standings.value = {
    season: {
      year: seasonYear.value,
      season: seasonName.value,
    },
    rounds: [],
    teams: [],
  }

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

watch([isFootballTeam, seasonYear, seasonName], loadStandings)

watch(isFootballTeam, loadAssetSummary, {
  immediate: true,
})

// 初始化赛季积分榜：从最新赛季开始查找有数据的赛季
const initializeStandings = async () => {
  if (!isFootballTeam.value) return

  for (const season of [...seasons].reverse()) {
    const requestSeq = ++standingsRequestSequence

    try {
      const payload = await fetchFootballStandings({
        year: seasonYear.value,
        season,
      })

      if (requestSeq !== standingsRequestSequence) return

      if (payload.rounds && payload.rounds.length > 0) {
        seasonName.value = season
        return
      }
    } catch {
      if (requestSeq !== standingsRequestSequence) return
    }
  }
}

onMounted(initializeStandings)
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
            <div class="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div class="min-w-0 md:flex-1">
                <h2 class="text-lg font-bold" :style="{ color: teamColors[activeTeam].primary }">
                  赛季积分榜
                </h2>
                <p class="mt-2 text-sm text-white/55">按赛季查看三支球队积分对比与每轮明细。</p>
              </div>
              <div
                class="bg-[#0b0d12]/88 flex max-w-full flex-nowrap items-center gap-1.5 self-start rounded-[20px] border border-white/10 p-1 shadow-[0_18px_40px_rgba(0,0,0,0.24)] backdrop-blur-md md:ml-4"
              >
                <div
                  class="season-year-select border-white/8 bg-white/6 relative shrink-0 overflow-hidden rounded-[14px] border"
                >
                  <select
                    v-model.number="seasonYear"
                    data-testid="standings-season-year"
                    class="season-year-select__input focus:border-white/18 focus:bg-white/8 appearance-none rounded-[14px] border border-transparent bg-transparent px-3 py-2.5 pr-8 text-[12px] font-semibold tracking-[0.03em] text-white outline-none transition sm:px-4 sm:py-3 sm:pr-10 sm:text-sm sm:tracking-[0.04em]"
                  >
                    <option v-for="year in seasonYears" :key="year" :value="year">
                      {{ year }}
                    </option>
                  </select>
                  <span
                    class="text-white/38 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 sm:right-3"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </span>
                </div>
                <div
                  class="bg-white/4 sm:rounded-16px flex flex-nowrap items-center gap-0.5 rounded-[14px] p-0.5 sm:gap-1 sm:p-1"
                >
                  <button
                    v-for="season in seasons"
                    :key="season"
                    :data-season-name="season"
                    type="button"
                    class="season-tab hover:border-white/12 hover:bg-white/6 text-white/52 min-w-52px sm:min-w-68px sm:rounded-12px cursor-pointer whitespace-nowrap rounded-[10px] border border-transparent px-2 py-2 text-[11px] font-medium tracking-[0.02em] transition sm:px-3 sm:py-2.5 sm:text-xs sm:tracking-[0.04em]"
                    :class="isActiveSeason(season) ? 'season-tab--active' : ''"
                    :style="getSeasonTabStyle(season)"
                    @click="selectSeason(season)"
                  >
                    {{ season }}
                  </button>
                </div>
              </div>
            </div>

            <div
              v-if="standingsError"
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

            <div v-else class="space-y-5">
              <div>
                <div class="grid grid-cols-3 gap-2 md:gap-3">
                  <article
                    v-for="team in displayedStandingTeams"
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
                    <div
                      data-test="standing-team-card-main"
                      class="flex flex-col items-center gap-2 text-center md:flex-row md:items-start md:justify-between md:gap-3 md:text-left"
                    >
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
                          data-test="standing-team-logo"
                          class="md:h-13 md:w-13 relative flex h-11 w-11 items-center justify-center rounded-2xl border"
                          :aria-label="`${team.teamName}：${getStandingTeamLogo(team.teamCode).label}`"
                          :style="{
                            borderColor:
                              standingTeamAccents[team.teamCode]?.border || 'rgba(255,255,255,0.1)',
                            background: `radial-gradient(circle at 50% 28%, ${
                              standingTeamAccents[team.teamCode]?.glow || 'rgba(255,255,255,0.08)'
                            }, rgba(255,255,255,0.04) 68%)`,
                            color: getStandingTeamLogo(team.teamCode).color,
                          }"
                        >
                          <Icon
                            data-test="standing-team-crown-icon"
                            icon="mdi:crown"
                            class="absolute -top-2 h-4 w-4 rotate-[-8deg] text-amber-200 drop-shadow-[0_4px_8px_rgba(245,158,11,0.28)] md:h-5 md:w-5"
                          />
                          <Icon
                            data-test="standing-team-logo-icon"
                            :icon="getStandingTeamLogo(team.teamCode).icon"
                            class="h-7 w-7 md:h-8 md:w-8"
                            :class="getStandingTeamLogo(team.teamCode).iconClass"
                          />
                        </div>
                      </div>
                    </div>
                    <div
                      data-test="standing-card-decoration"
                      class="mt-3 flex h-2 gap-1.5 overflow-hidden rounded-full"
                      aria-hidden="true"
                    >
                      <span
                        class="h-full flex-[1.8] rounded-full opacity-90"
                        :style="{
                          backgroundColor:
                            standingTeamAccents[team.teamCode]?.fill ||
                            teamColors[activeTeam].primary,
                        }"
                      ></span>
                      <span
                        class="h-full flex-1 rounded-full"
                        :style="{
                          backgroundColor:
                            standingTeamAccents[team.teamCode]?.glow || 'rgba(255,255,255,0.14)',
                        }"
                      ></span>
                      <span class="bg-white/12 h-full w-3 rounded-full"></span>
                    </div>
                  </article>
                </div>
              </div>

              <div class="border-white/8 overflow-hidden rounded-2xl border bg-[#0f1117]">
                <div class="overflow-x-auto">
                  <table
                    data-test="standing-round-table"
                    class="w-full table-fixed text-left text-xs text-white/80 md:text-sm"
                  >
                    <thead class="bg-white/3 text-xs uppercase tracking-[0.14em] text-white/40">
                      <tr>
                        <th
                          data-test="standing-round-heading"
                          class="w-12 whitespace-nowrap px-2 py-3 font-medium md:w-auto md:px-4"
                        >
                          轮次
                        </th>
                        <th
                          v-for="team in displayedStandingTeams"
                          :key="team.teamId"
                          class="px-1 py-3 text-center font-medium md:px-4"
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
                        <th class="whitespace-nowrap px-2 py-3 font-semibold text-white md:px-4">
                          {{ row.label }}
                        </th>
                        <td
                          v-for="(point, pointIndex) in row.points"
                          :key="`${row.id}-${pointIndex}`"
                          class="text-white/72 px-1 py-3 text-center md:px-4"
                        >
                          <span
                            v-if="getStandingPointIcon(point)"
                            data-test="standing-point-icon"
                            class="inline-flex h-7 w-7 items-center justify-center rounded-full border md:h-8 md:w-8"
                            :class="[
                              getStandingPointIcon(point).background,
                              getStandingPointIcon(point).border,
                            ]"
                            :aria-label="getStandingPointIcon(point).label"
                          >
                            <Icon
                              :icon="getStandingPointIcon(point).icon"
                              class="md:h-4.5 md:w-4.5 h-4 w-4"
                              :class="getStandingPointIcon(point).color"
                            />
                          </span>
                          <span
                            v-else
                            class="inline-flex h-7 w-7 items-center justify-center md:h-8 md:w-8"
                          >
                            {{ point ?? '-' }}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                    <tfoot class="border-white/8 bg-white/2 border-t">
                      <tr>
                        <th class="px-2 py-3 font-semibold text-white md:px-4">徽记</th>
                        <td
                          v-for="team in displayedStandingTeams"
                          :key="`total-${team.teamId}`"
                          class="px-1 py-3 text-center font-semibold text-white md:px-4"
                        >
                          <span
                            data-test="standing-total-decoration"
                            class="mx-auto flex h-6 w-12 items-center justify-center gap-1 rounded-full border border-white/10 bg-white/5 md:h-7 md:w-16"
                            aria-hidden="true"
                          >
                            <span
                              class="h-1.5 w-5 rounded-full md:w-7"
                              :style="{
                                backgroundColor:
                                  standingTeamAccents[team.teamCode]?.fill ||
                                  teamColors[activeTeam].primary,
                              }"
                            ></span>
                            <span class="bg-white/28 h-1.5 w-1.5 rounded-full"></span>
                            <span class="bg-white/16 h-1.5 w-1.5 rounded-full"></span>
                          </span>
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

.season-year-select::after {
  position: absolute;
  inset: 0;
  pointer-events: none;
  content: '';
  border-radius: inherit;
  box-shadow: inset 0 1px 0 rgb(255, 255, 255, 4%);
}

.season-year-select__input {
  min-width: 72px;
}

.season-year-select__input::-ms-expand {
  display: none;
}

.season-tab--active {
  font-weight: 600;
}

@media (width >= 640px) {
  .season-year-select__input {
    min-width: 88px;
  }
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
