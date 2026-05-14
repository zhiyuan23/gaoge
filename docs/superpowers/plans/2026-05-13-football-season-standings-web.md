# Football Season Standings Web Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a season-scoped football standings API and render the `2026 春季赛` standings block inside the existing `apps/web` high-level Gaoge FC team page.

**Architecture:** Keep the existing football match data model unchanged and add a read-only `standing` module in `apps/api` that aggregates `Team + MatchRound + MatchRoundResult` by `year + season`. In `apps/web`, add a minimal fetch layer for standings data, then render a season filter, a lightweight CSS bar chart, and a standings table inside `TeamsPage.vue`.

**Tech Stack:** NestJS, Prisma, Jest, Vue 3, Vue Router, Vitest, workspace shared types

---

## File Structure

### Shared types

- Modify: `packages/shared/types/src/team.ts`
- Modify: `packages/shared/types/src/index.ts`

### API standings module

- Modify: `apps/api/src/modules/football/football.module.ts`
- Create: `apps/api/src/modules/football/standing/standing.module.ts`
- Create: `apps/api/src/modules/football/standing/standing.controller.ts`
- Create: `apps/api/src/modules/football/standing/standing.service.ts`
- Create: `apps/api/src/modules/football/standing/standing.service.spec.ts`

### Web standings data and page rendering

- Create: `apps/web/src/utils/api.js`
- Create: `apps/web/src/utils/football.js`
- Modify: `apps/web/src/views/TeamsPage.vue`
- Create: `apps/web/src/views/TeamsPage.test.js`

## Task 1: Add shared standings contract

**Files:**

- Modify: `packages/shared/types/src/team.ts`
- Modify: `packages/shared/types/src/index.ts`
- Test: `pnpm typecheck`

- [ ] **Step 1: Write the failing shared type usage in a focused API spec**

Create the first failing expectation in `apps/api/src/modules/football/standing/standing.service.spec.ts` so the missing shared types are referenced before implementation:

```ts
import type { FootballStandingResponse } from '@gaoge/shared-types'

describe('StandingService', () => {
  it('returns a typed season standings payload', () => {
    const payload: FootballStandingResponse = {
      season: {
        year: 2026,
        season: '春季赛',
      },
      rounds: [],
      teams: [],
    }

    expect(payload.season.year).toBe(2026)
  })
})
```

- [ ] **Step 2: Run type-aware API tests to confirm shared standings types do not exist yet**

Run:

```bash
pnpm --filter @gaoge/app-api test -- --runInBand src/modules/football/standing/standing.service.spec.ts
```

Expected: FAIL because `@gaoge/shared-types` does not export `FootballStandingResponse`.

- [ ] **Step 3: Add standings contracts to shared team types**

Append these exports near the existing football `MatchRound*` types in `packages/shared/types/src/team.ts`:

```ts
export interface FootballStandingParams {
  year: number | string
  season: MatchRoundSeason
}

export interface FootballStandingRound {
  id: number
  round: number
  matchDate: DateTimeString
  label: string
}

export interface FootballStandingTeam {
  teamId: number
  teamCode: TeamCode
  teamName: string
  totalPoints: number
  roundPoints: number[]
}

export interface FootballStandingResponse {
  season: {
    year: number
    season: MatchRoundSeason
  }
  rounds: FootballStandingRound[]
  teams: FootballStandingTeam[]
}
```

Keep `packages/shared/types/src/index.ts` exporting `./team.js` as-is; only touch it if the new types force an export order fix.

- [ ] **Step 4: Run workspace typecheck to verify the shared contract compiles**

Run:

```bash
pnpm typecheck
```

Expected: PASS or existing unrelated failures only. If there are unrelated failures, record them before moving on.

- [ ] **Step 5: Commit the shared contract change**

```bash
git add packages/shared/types/src/team.ts packages/shared/types/src/index.ts apps/api/src/modules/football/standing/standing.service.spec.ts
git commit -m "feat: add football standings shared types"
```

## Task 2: Build the football standings read API

**Files:**

- Modify: `apps/api/src/modules/football/football.module.ts`
- Create: `apps/api/src/modules/football/standing/standing.module.ts`
- Create: `apps/api/src/modules/football/standing/standing.controller.ts`
- Create: `apps/api/src/modules/football/standing/standing.service.ts`
- Modify: `apps/api/src/modules/football/standing/standing.service.spec.ts`
- Test: `apps/api/src/modules/football/standing/standing.service.spec.ts`

- [ ] **Step 1: Write the failing standings service tests for season aggregation and empty seasons**

Create `apps/api/src/modules/football/standing/standing.service.spec.ts`:

```ts
import { BadRequestException } from '@nestjs/common'

import { StandingService } from './standing.service'

describe('StandingService', () => {
  const createService = () => {
    const prisma = {
      team: {
        findMany: jest.fn(),
      },
      matchRound: {
        findMany: jest.fn(),
      },
    }

    return {
      prisma,
      service: new StandingService(prisma as any),
    }
  }

  it('aggregates one season into rounds, per-round points, and total points', async () => {
    const { prisma, service } = createService()

    prisma.team.findMany.mockResolvedValue([
      { id: 1, code: 'real', name: '皇家高歌', sort: 1 },
      { id: 2, code: 'inter', name: '高歌国际', sort: 2 },
      { id: 3, code: 'united', name: '高歌联', sort: 3 },
    ])
    prisma.matchRound.findMany.mockResolvedValue([
      {
        id: 11,
        year: 2026,
        season: '春季赛',
        round: 1,
        matchDate: new Date('2026-03-01T12:00:00.000Z'),
        results: [
          { teamId: 1, rank: 1, points: 2 },
          { teamId: 2, rank: 2, points: 1 },
          { teamId: 3, rank: 3, points: 0 },
        ],
      },
      {
        id: 12,
        year: 2026,
        season: '春季赛',
        round: 2,
        matchDate: new Date('2026-03-08T12:00:00.000Z'),
        results: [
          { teamId: 2, rank: 1, points: 2 },
          { teamId: 3, rank: 2, points: 1 },
          { teamId: 1, rank: 3, points: 0 },
        ],
      },
    ])

    await expect(service.findSeasonStanding({ year: 2026, season: '春季赛' })).resolves.toEqual({
      season: {
        year: 2026,
        season: '春季赛',
      },
      rounds: [
        { id: 11, round: 1, matchDate: new Date('2026-03-01T12:00:00.000Z'), label: '第1轮' },
        { id: 12, round: 2, matchDate: new Date('2026-03-08T12:00:00.000Z'), label: '第2轮' },
      ],
      teams: [
        { teamId: 1, teamCode: 'real', teamName: '皇家高歌', totalPoints: 2, roundPoints: [2, 0] },
        { teamId: 2, teamCode: 'inter', teamName: '高歌国际', totalPoints: 3, roundPoints: [1, 2] },
        { teamId: 3, teamCode: 'united', teamName: '高歌联', totalPoints: 1, roundPoints: [0, 1] },
      ],
    })
  })

  it('returns three zero-point teams for an empty season', async () => {
    const { prisma, service } = createService()

    prisma.team.findMany.mockResolvedValue([
      { id: 1, code: 'real', name: '皇家高歌', sort: 1 },
      { id: 2, code: 'inter', name: '高歌国际', sort: 2 },
      { id: 3, code: 'united', name: '高歌联', sort: 3 },
    ])
    prisma.matchRound.findMany.mockResolvedValue([])

    await expect(service.findSeasonStanding({ year: 2026, season: '春季赛' })).resolves.toEqual({
      season: {
        year: 2026,
        season: '春季赛',
      },
      rounds: [],
      teams: [
        { teamId: 1, teamCode: 'real', teamName: '皇家高歌', totalPoints: 0, roundPoints: [] },
        { teamId: 2, teamCode: 'inter', teamName: '高歌国际', totalPoints: 0, roundPoints: [] },
        { teamId: 3, teamCode: 'united', teamName: '高歌联', totalPoints: 0, roundPoints: [] },
      ],
    })
  })

  it('rejects missing season parameters', async () => {
    const { service } = createService()

    await expect(
      service.findSeasonStanding({ year: '', season: undefined as never }),
    ).rejects.toThrow(new BadRequestException('year 和 season 为必填参数'))
  })
})
```

- [ ] **Step 2: Run the focused API test to verify the module does not exist yet**

Run:

```bash
pnpm --filter @gaoge/app-api test -- --runInBand src/modules/football/standing/standing.service.spec.ts
```

Expected: FAIL because `standing.service.ts` does not exist yet.

- [ ] **Step 3: Implement the standings module, controller, and service**

Create `apps/api/src/modules/football/standing/standing.service.ts`:

```ts
import { BadRequestException, Injectable } from '@nestjs/common'

import type {
  FootballStandingParams,
  FootballStandingResponse,
  MatchRoundSeason,
  TeamCode,
} from '@gaoge/shared-types'

import { PrismaService } from '@/common/prisma/prisma.service'

@Injectable()
export class StandingService {
  constructor(private readonly prisma: PrismaService) {}

  async findSeasonStanding(params: FootballStandingParams): Promise<FootballStandingResponse> {
    const year = Number(params.year)
    const season = params.season

    if (!Number.isInteger(year) || year <= 0 || !season) {
      throw new BadRequestException('year 和 season 为必填参数')
    }

    const [teams, rounds] = await this.prisma.$transaction([
      this.prisma.team.findMany({
        orderBy: [{ sort: 'asc' }, { id: 'asc' }],
      }),
      this.prisma.matchRound.findMany({
        where: {
          year,
          season,
        },
        orderBy: [{ round: 'asc' }, { matchDate: 'asc' }, { id: 'asc' }],
        include: {
          results: {
            orderBy: { rank: 'asc' },
          },
        },
      }),
    ])

    const roundItems = rounds.map((round) => ({
      id: round.id,
      round: round.round,
      matchDate: round.matchDate,
      label: `第${round.round}轮`,
    }))

    const teamMap = new Map(
      teams.map((team) => [
        team.id,
        {
          teamId: team.id,
          teamCode: team.code as TeamCode,
          teamName: team.name,
          totalPoints: 0,
          roundPoints: [] as number[],
          sort: team.sort,
        },
      ]),
    )

    for (const round of rounds) {
      if (round.results.length !== 3) {
        throw new BadRequestException('比赛结果数据异常')
      }

      const pointsByTeam = new Map(round.results.map((result) => [result.teamId, result.points]))

      for (const team of teams) {
        const standingTeam = teamMap.get(team.id)

        if (!standingTeam) {
          throw new BadRequestException('比赛结果数据异常')
        }

        const points = pointsByTeam.get(team.id)

        if (points === undefined) {
          throw new BadRequestException('比赛结果数据异常')
        }

        standingTeam.roundPoints.push(points)
        standingTeam.totalPoints += points
      }
    }

    const standingTeams = [...teamMap.values()]
      .sort((left, right) => {
        if (right.totalPoints !== left.totalPoints) {
          return right.totalPoints - left.totalPoints
        }

        if (left.sort !== right.sort) {
          return left.sort - right.sort
        }

        return left.teamId - right.teamId
      })
      .map(({ sort, ...team }) => team)

    return {
      season: {
        year,
        season: season as MatchRoundSeason,
      },
      rounds: roundItems,
      teams: standingTeams,
    }
  }
}
```

Create `apps/api/src/modules/football/standing/standing.controller.ts`:

```ts
import { Controller, Get, Query } from '@nestjs/common'

import type { FootballStandingParams } from '@gaoge/shared-types'

import { StandingService } from './standing.service'

@Controller('football/standings')
export class StandingController {
  constructor(private readonly standingService: StandingService) {}

  @Get()
  findSeasonStanding(@Query() query: FootballStandingParams) {
    return this.standingService.findSeasonStanding(query)
  }
}
```

Create `apps/api/src/modules/football/standing/standing.module.ts`:

```ts
import { Module } from '@nestjs/common'

import { StandingController } from './standing.controller'
import { StandingService } from './standing.service'

@Module({
  controllers: [StandingController],
  providers: [StandingService],
  exports: [StandingService],
})
export class StandingModule {}
```

Update `apps/api/src/modules/football/football.module.ts`:

```ts
import { StandingModule } from './standing/standing.module'

@Module({
  imports: [
    PlayerModule,
    TeamModule,
    MatchRoundModule,
    FundModule,
    AssetRecordModule,
    StandingModule,
  ],
})
export class FootballModule {}
```

- [ ] **Step 4: Run the focused standings service test and then the football route smoke tests**

Run:

```bash
pnpm --filter @gaoge/app-api test -- --runInBand src/modules/football/standing/standing.service.spec.ts
pnpm --filter @gaoge/app-api test -- --runInBand src/modules/football-routing.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Commit the API standings module**

```bash
git add packages/shared/types/src/team.ts apps/api/src/modules/football/football.module.ts apps/api/src/modules/football/standing
git commit -m "feat(api): add football standings endpoint"
```

## Task 3: Add a minimal web standings fetch layer

**Files:**

- Create: `apps/web/src/utils/api.js`
- Create: `apps/web/src/utils/football.js`
- Test: `apps/web/src/views/TeamsPage.test.js`

- [ ] **Step 1: Write the failing web test for a standings fetch call**

Create the first test in `apps/web/src/views/TeamsPage.test.js`:

```js
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

vi.mock('@/utils/football', () => ({
  fetchFootballStandings: vi.fn(),
}))

import TeamsPage from './TeamsPage.vue'
import { fetchFootballStandings } from '@/utils/football'

describe('TeamsPage football standings', () => {
  beforeEach(() => {
    fetchFootballStandings.mockReset()
  })

  it('requests the default 2026 spring standings for football pages', async () => {
    fetchFootballStandings.mockResolvedValue({
      season: { year: 2026, season: '春季赛' },
      rounds: [],
      teams: [],
    })

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/teams/:team?', component: TeamsPage }],
    })

    router.push('/teams/football')
    await router.isReady()

    mount(TeamsPage, {
      global: {
        plugins: [router],
      },
    })

    await flushPromises()

    expect(fetchFootballStandings).toHaveBeenCalledWith({
      year: 2026,
      season: '春季赛',
    })
  })
})
```

- [ ] **Step 2: Run the web test to confirm the fetch helpers do not exist**

Run:

```bash
pnpm --filter @gaoge/app-web test -- src/views/TeamsPage.test.js
```

Expected: FAIL because `@/utils/football` and the fetch function do not exist yet.

- [ ] **Step 3: Implement the minimal fetch utilities**

Create `apps/web/src/utils/api.js`:

```js
const DEFAULT_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

export async function getJson(path, searchParams = {}) {
  const url = new URL(path, DEFAULT_API_BASE_URL)

  Object.entries(searchParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value))
    }
  })

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  const payload = await response.json()
  return payload.data ?? payload
}
```

Create `apps/web/src/utils/football.js`:

```js
import { getJson } from './api'

export function fetchFootballStandings({ year, season }) {
  return getJson('/football/standings', { year, season })
}
```

- [ ] **Step 4: Re-run the focused web test**

Run:

```bash
pnpm --filter @gaoge/app-web test -- src/views/TeamsPage.test.js
```

Expected: FAIL next on missing `TeamsPage.vue` standings rendering state, but PASS on module resolution and fetch invocation once the page integration is complete.

- [ ] **Step 5: Commit the web data-layer scaffolding**

```bash
git add apps/web/src/utils/api.js apps/web/src/utils/football.js apps/web/src/views/TeamsPage.test.js
git commit -m "feat(web): add football standings fetch helpers"
```

## Task 4: Render the standings block inside the football team page

**Files:**

- Modify: `apps/web/src/views/TeamsPage.vue`
- Modify: `apps/web/src/views/TeamsPage.test.js`
- Test: `apps/web/src/views/TeamsPage.test.js`

- [ ] **Step 1: Extend the failing web test to cover empty state and loaded standings**

Append to `apps/web/src/views/TeamsPage.test.js`:

```js
it('renders the standings section and totals after loading football data', async () => {
  fetchFootballStandings.mockResolvedValue({
    season: { year: 2026, season: '春季赛' },
    rounds: [
      { id: 1, round: 1, matchDate: '2026-03-01T12:00:00.000Z', label: '第1轮' },
      { id: 2, round: 2, matchDate: '2026-03-08T12:00:00.000Z', label: '第2轮' },
    ],
    teams: [
      { teamId: 2, teamCode: 'inter', teamName: '高歌国际', totalPoints: 3, roundPoints: [1, 2] },
      { teamId: 1, teamCode: 'real', teamName: '皇家高歌', totalPoints: 2, roundPoints: [2, 0] },
      { teamId: 3, teamCode: 'united', teamName: '高歌联', totalPoints: 1, roundPoints: [0, 1] },
    ],
  })

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/teams/:team?', component: TeamsPage }],
  })

  router.push('/teams/football')
  await router.isReady()

  const wrapper = mount(TeamsPage, {
    global: {
      plugins: [router],
    },
  })

  await flushPromises()

  expect(wrapper.text()).toContain('赛季积分榜榜')
  expect(wrapper.text()).toContain('2026')
  expect(wrapper.text()).toContain('春季赛')
  expect(wrapper.text()).toContain('高歌国际')
  expect(wrapper.text()).toContain('总积分')
  expect(wrapper.text()).toContain('3')
})

it('renders an empty state when the season has no rounds', async () => {
  fetchFootballStandings.mockResolvedValue({
    season: { year: 2026, season: '春季赛' },
    rounds: [],
    teams: [
      { teamId: 1, teamCode: 'real', teamName: '皇家高歌', totalPoints: 0, roundPoints: [] },
      { teamId: 2, teamCode: 'inter', teamName: '高歌国际', totalPoints: 0, roundPoints: [] },
      { teamId: 3, teamCode: 'united', teamName: '高歌联', totalPoints: 0, roundPoints: [] },
    ],
  })

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/teams/:team?', component: TeamsPage }],
  })

  router.push('/teams/football')
  await router.isReady()

  const wrapper = mount(TeamsPage, {
    global: {
      plugins: [router],
    },
  })

  await flushPromises()

  expect(wrapper.text()).toContain('暂无比赛数据')
})
```

- [ ] **Step 2: Run the focused test to capture the missing page behavior**

Run:

```bash
pnpm --filter @gaoge/app-web test -- src/views/TeamsPage.test.js
```

Expected: FAIL because `TeamsPage.vue` has no standings UI, state, or fetch lifecycle.

- [ ] **Step 3: Implement standings state, fetch lifecycle, chart, and table**

Update the `<script setup>` block in `apps/web/src/views/TeamsPage.vue` to add football-only standings state:

```js
import { fetchFootballStandings } from '@/utils/football'

const seasonYear = ref(2026)
const seasonName = ref('春季赛')
const standings = ref({
  season: { year: 2026, season: '春季赛' },
  rounds: [],
  teams: [],
})
const standingsLoading = ref(false)
const standingsError = ref('')

const isFootballTeam = computed(() => activeTeam.value === 'gaoge-fc')
const seasons = ['春季赛', '夏季赛', '秋季赛', '冬季赛']
const seasonYears = [2026]

const totalRowPoints = computed(() =>
  standings.value.rounds.map((_, roundIndex) =>
    standings.value.teams.reduce((sum, team) => sum + (team.roundPoints[roundIndex] || 0), 0),
  ),
)

const grandTotalPoints = computed(() =>
  standings.value.teams.reduce((sum, team) => sum + team.totalPoints, 0),
)

async function loadStandings() {
  if (!isFootballTeam.value) {
    return
  }

  standingsLoading.value = true
  standingsError.value = ''

  try {
    standings.value = await fetchFootballStandings({
      year: seasonYear.value,
      season: seasonName.value,
    })
  } catch (error) {
    standingsError.value = error instanceof Error ? error.message : '加载排行榜失败'
  } finally {
    standingsLoading.value = false
  }
}

watch(
  [isFootballTeam, seasonYear, seasonName],
  () => {
    loadStandings()
  },
  { immediate: true },
)
```

Add this standings block below the existing team description section and before the gallery:

```vue
<section
  v-if="isFootballTeam"
  class="mb-8 rounded-3xl border border-white/10 bg-white/5 p-4 md:p-6"
>
  <div class="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
    <div>
      <h2 class="text-xl font-bold" :style="{ color: teamColors[activeTeam].primary }">赛季积分榜榜</h2>
      <p class="mt-1 text-sm text-white/50">按赛季查看三支球队积分对比与每轮明细</p>
    </div>
    <div class="flex gap-2">
      <select v-model="seasonYear" class="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm">
        <option v-for="year in seasonYears" :key="year" :value="year">{{ year }}</option>
      </select>
      <select v-model="seasonName" class="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm">
        <option v-for="season in seasons" :key="season" :value="season">{{ season }}</option>
      </select>
    </div>
  </div>

  <div v-if="standingsLoading" class="rounded-2xl border border-white/5 bg-black/20 px-4 py-10 text-center text-sm text-white/50">
    排行榜加载中...
  </div>
  <div v-else-if="standingsError" class="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-10 text-center text-sm text-red-200">
    {{ standingsError }}
  </div>
  <template v-else>
    <div class="mb-6 grid gap-3 md:grid-cols-3">
      <article
        v-for="team in standings.teams"
        :key="team.teamId"
        class="rounded-2xl border border-white/10 bg-black/20 p-4"
      >
        <div class="mb-3 flex items-end justify-between">
          <div>
            <p class="text-sm text-white/60">{{ team.teamName }}</p>
            <p class="text-3xl font-bold text-white">{{ team.totalPoints }}</p>
          </div>
          <div class="flex h-24 w-12 items-end rounded-full bg-white/5 p-1">
            <div
              class="w-full rounded-full"
              :style="{
                height: `${Math.max(12, team.totalPoints * 24)}px`,
                backgroundColor: teamColors[activeTeam].primary,
              }"
            />
          </div>
        </div>
        <p class="text-xs uppercase tracking-[0.2em] text-white/40">总积分</p>
      </article>
    </div>

    <div v-if="standings.rounds.length === 0" class="rounded-2xl border border-white/5 bg-black/20 px-4 py-10 text-center text-sm text-white/50">
      暂无比赛数据
    </div>
    <div v-else class="overflow-x-auto">
      <table class="min-w-full border-separate border-spacing-0 overflow-hidden rounded-2xl">
        <thead>
          <tr class="bg-white/8 text-left text-sm text-white/70">
            <th class="px-4 py-3">球队</th>
            <th v-for="round in standings.rounds" :key="round.id" class="px-4 py-3 whitespace-nowrap">
              {{ round.label }}
            </th>
            <th class="px-4 py-3 whitespace-nowrap">总积分</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="team in standings.teams" :key="team.teamId" class="bg-black/20 text-sm text-white">
            <td class="border-t border-white/5 px-4 py-3">{{ team.teamName }}</td>
            <td
              v-for="(points, index) in team.roundPoints"
              :key="`${team.teamId}-${index}`"
              class="border-t border-white/5 px-4 py-3 text-center"
            >
              {{ points }}
            </td>
            <td class="border-t border-white/5 px-4 py-3 text-center font-semibold">{{ team.totalPoints }}</td>
          </tr>
          <tr class="bg-white/5 text-sm font-semibold text-white">
            <td class="border-t border-white/5 px-4 py-3">总积分</td>
            <td v-for="(points, index) in totalRowPoints" :key="`total-${index}`" class="border-t border-white/5 px-4 py-3 text-center">
              {{ points }}
            </td>
            <td class="border-t border-white/5 px-4 py-3 text-center">{{ grandTotalPoints }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </template>
</section>
```

- [ ] **Step 4: Run the focused web tests, then the existing app shell test**

Run:

```bash
pnpm --filter @gaoge/app-web test -- src/views/TeamsPage.test.js
pnpm --filter @gaoge/app-web test
pnpm --filter @gaoge/app-web typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit the page integration**

```bash
git add apps/web/src/views/TeamsPage.vue apps/web/src/views/TeamsPage.test.js apps/web/src/utils/api.js apps/web/src/utils/football.js
git commit -m "feat(web): render football season standings"
```

## Task 5: Final verification and handoff

**Files:**

- Modify: none expected beyond any fixes found by verification
- Test: workspace verification commands

- [ ] **Step 1: Run backend verification**

```bash
pnpm --filter @gaoge/app-api test -- --runInBand src/modules/football/standing/standing.service.spec.ts
pnpm --filter @gaoge/app-api typecheck
```

Expected: PASS.

- [ ] **Step 2: Run frontend verification**

```bash
pnpm --filter @gaoge/app-web test
pnpm --filter @gaoge/app-web typecheck
```

Expected: PASS.

- [ ] **Step 3: Run repo-level formatting and lint checks for touched files**

```bash
pnpm lint
```

Expected: PASS, or record any unrelated existing failures before handing off.

- [ ] **Step 4: Capture final git state**

```bash
git status --short
git log --oneline -n 5
```

Expected: clean working tree or only intentional uncommitted follow-up fixes.

- [ ] **Step 5: Prepare handoff summary**

Summarize:

- New `GET /football/standings` API and the season-scoped aggregation rules
- New `apps/web` standings block location and interactions
- Verification commands actually run and their outcomes
