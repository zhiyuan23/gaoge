# Team And Match Info Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build real `球队信息` and `比赛信息` CRUD pages at the same menu level as `球员信息`, including Prisma models, NestJS APIs, admin routes, and admin CRUD UIs.

**Architecture:** Reuse the existing `player` module pattern on both the API and admin sides. Introduce a dedicated `teams` resource for team information to avoid conflicting with the existing `/api/team/fund` team-fund module, and introduce `match-rounds` plus `match-round-results` storage as the minimal match domain needed for standings later.

**Tech Stack:** Prisma, PostgreSQL, NestJS, class-validator, workspace shared types, Vue 3, Element Plus, TypeScript

---

## File Structure

### API

- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/20260429_add_team_and_match_round_models/migration.sql`
- Modify: `apps/api/src/app.module.ts`
- Create: `apps/api/src/modules/teams/teams.controller.ts`
- Create: `apps/api/src/modules/teams/teams.module.ts`
- Create: `apps/api/src/modules/teams/teams.service.ts`
- Create: `apps/api/src/modules/teams/dto/create-team.dto.ts`
- Create: `apps/api/src/modules/teams/dto/update-team.dto.ts`
- Create: `apps/api/src/modules/teams/teams.service.spec.ts`
- Create: `apps/api/src/modules/match-rounds/match-rounds.controller.ts`
- Create: `apps/api/src/modules/match-rounds/match-rounds.module.ts`
- Create: `apps/api/src/modules/match-rounds/match-rounds.service.ts`
- Create: `apps/api/src/modules/match-rounds/dto/create-match-round.dto.ts`
- Create: `apps/api/src/modules/match-rounds/dto/update-match-round.dto.ts`
- Create: `apps/api/src/modules/match-rounds/match-rounds.service.spec.ts`

### Shared Types

- Modify: `packages/shared/types/src/team.ts`
- Modify: `packages/shared/types/src/index.ts`

### Admin APIs

- Create: `apps/admin/src/api/teams/index.ts`
- Create: `apps/admin/src/api/match-rounds/index.ts`

### Admin Team Page

- Create: `apps/admin/src/views/gaoge/team/auth.ts`
- Create: `apps/admin/src/views/gaoge/team/index.vue`
- Create: `apps/admin/src/views/gaoge/team/model/defaults.ts`
- Create: `apps/admin/src/views/gaoge/team/model/mapper.ts`
- Create: `apps/admin/src/views/gaoge/team/model/types.ts`
- Create: `apps/admin/src/views/gaoge/team/schemas/form.ts`
- Create: `apps/admin/src/views/gaoge/team/schemas/search.ts`
- Create: `apps/admin/src/views/gaoge/team/schemas/table.ts`
- Create: `apps/admin/src/views/gaoge/team/components/TeamFormDialog.vue`

### Admin Match Round Page

- Create: `apps/admin/src/views/gaoge/match_round/auth.ts`
- Create: `apps/admin/src/views/gaoge/match_round/index.vue`
- Create: `apps/admin/src/views/gaoge/match_round/model/defaults.ts`
- Create: `apps/admin/src/views/gaoge/match_round/model/mapper.ts`
- Create: `apps/admin/src/views/gaoge/match_round/model/types.ts`
- Create: `apps/admin/src/views/gaoge/match_round/schemas/form.ts`
- Create: `apps/admin/src/views/gaoge/match_round/schemas/search.ts`
- Create: `apps/admin/src/views/gaoge/match_round/schemas/table.ts`
- Create: `apps/admin/src/views/gaoge/match_round/components/MatchRoundFormDialog.vue`

### Routing

- Modify: `apps/admin/src/router/modules/gaoge/index.ts`

---

### Task 1: Shared Types and Prisma Models

**Files:**

- Modify: `packages/shared/types/src/team.ts`
- Modify: `packages/shared/types/src/index.ts`
- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/20260429_add_team_and_match_round_models/migration.sql`

- [ ] **Step 1: Write the failing Prisma/typecheck baseline**

Run: `pnpm --filter @gaoge/app-api typecheck`  
Expected: PASS before changes, establishing current baseline

- [ ] **Step 2: Extend shared team types with team info and match-round contracts**

```ts
export interface Team {
  id: number
  code: string
  name: string
  slogan: string | null
  sponsorName: string | null
  sort: number
  createdAt: DateTimeString
  updatedAt: DateTimeString
}

export interface TeamPayload {
  name: string
  slogan?: string
  sponsorName?: string
  sort: number
}

export interface TeamListParams {
  keyword?: string
}

export interface MatchRoundResultItem {
  teamId: number
  rank: 1 | 2 | 3
  points: number
  teamName?: string
}

export interface MatchRound {
  id: number
  matchDate: DateTimeString
  venue: string | null
  remark: string | null
  results: MatchRoundResultItem[]
  createdAt: DateTimeString
  updatedAt: DateTimeString
}

export interface MatchRoundPayload {
  matchDate: DateTimeString
  venue?: string
  remark?: string
  results: Array<{
    teamId: number
    rank: 1 | 2 | 3
  }>
}
```

- [ ] **Step 3: Add Prisma models**

```prisma
model Team {
  id          Int                @id @default(autoincrement())
  code        String             @unique
  name        String             @unique
  slogan      String?
  sponsorName String?
  sort        Int                @default(0)
  createdAt   DateTime           @default(now())
  updatedAt   DateTime           @updatedAt

  matchResults MatchRoundResult[]

  @@index([sort])
}

model MatchRound {
  id        Int                @id @default(autoincrement())
  matchDate DateTime
  venue     String?
  remark    String?
  createdAt DateTime           @default(now())
  updatedAt DateTime           @updatedAt

  results   MatchRoundResult[]

  @@index([matchDate])
}

model MatchRoundResult {
  id           Int        @id @default(autoincrement())
  matchRoundId Int
  teamId       Int
  rank         Int
  points       Int
  createdAt    DateTime   @default(now())

  matchRound   MatchRound @relation(fields: [matchRoundId], references: [id], onDelete: Cascade)
  team         Team       @relation(fields: [teamId], references: [id], onDelete: Restrict)

  @@unique([matchRoundId, teamId])
  @@unique([matchRoundId, rank])
  @@index([teamId])
}
```

- [ ] **Step 4: Write the SQL migration**

```sql
CREATE TABLE "Team" (
  "id" SERIAL NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slogan" TEXT,
  "sponsorName" TEXT,
  "sort" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MatchRound" (
  "id" SERIAL NOT NULL,
  "matchDate" TIMESTAMP(3) NOT NULL,
  "venue" TEXT,
  "remark" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MatchRound_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MatchRoundResult" (
  "id" SERIAL NOT NULL,
  "matchRoundId" INTEGER NOT NULL,
  "teamId" INTEGER NOT NULL,
  "rank" INTEGER NOT NULL,
  "points" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MatchRoundResult_pkey" PRIMARY KEY ("id")
);
```

- [ ] **Step 5: Generate Prisma client and rerun typecheck**

Run: `pnpm --filter @gaoge/app-api db:generate`  
Expected: Prisma Client regenerated successfully

Run: `pnpm --filter @gaoge/app-api typecheck`  
Expected: PASS with new model definitions still unused

- [ ] **Step 6: Commit schema/types slice**

```bash
git add packages/shared/types/src/team.ts \
  packages/shared/types/src/index.ts \
  apps/api/prisma/schema.prisma \
  apps/api/prisma/migrations/20260429_add_team_and_match_round_models/migration.sql
git commit -m "feat: add team and match round models"
```

### Task 2: Teams API Module

**Files:**

- Modify: `apps/api/src/app.module.ts`
- Create: `apps/api/src/modules/teams/teams.controller.ts`
- Create: `apps/api/src/modules/teams/teams.module.ts`
- Create: `apps/api/src/modules/teams/teams.service.ts`
- Create: `apps/api/src/modules/teams/dto/create-team.dto.ts`
- Create: `apps/api/src/modules/teams/dto/update-team.dto.ts`
- Create: `apps/api/src/modules/teams/teams.service.spec.ts`

- [ ] **Step 1: Write the failing teams service tests**

```ts
import { TeamsService } from './teams.service'

describe('TeamsService', () => {
  it('filters by name keyword and sorts by sort asc then createdAt asc', async () => {
    const prisma = {
      team: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    } as any

    const service = new TeamsService(prisma)

    await service.findAll({ keyword: '高歌' })

    expect(prisma.team.findMany).toHaveBeenCalledWith({
      where: {
        name: {
          contains: '高歌',
          mode: 'insensitive',
        },
      },
      orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }],
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @gaoge/app-api test -- teams.service.spec.ts --runInBand`  
Expected: FAIL because the module does not exist yet

- [ ] **Step 3: Implement DTOs, service, controller, and module**

```ts
export class CreateTeamDto {
  @IsString()
  name: string

  @IsOptional()
  @IsString()
  slogan?: string

  @IsOptional()
  @IsString()
  sponsorName?: string

  @Type(() => Number)
  @IsInt()
  sort: number
}
```

```ts
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get()
  findAll(@Query() query: Record<string, string | undefined>) {
    return this.teamsService.findAll(query)
  }
}
```

```ts
async create(dto: CreateTeamDto) {
  return this.prisma.team.create({
    data: {
      code: createTeamCode(dto.name),
      name: dto.name.trim(),
      slogan: normalizeText(dto.slogan),
      sponsorName: normalizeText(dto.sponsorName),
      sort: dto.sort,
    },
  })
}
```

- [ ] **Step 4: Register the module and rerun the test**

Run: `pnpm --filter @gaoge/app-api test -- teams.service.spec.ts --runInBand`  
Expected: PASS

- [ ] **Step 5: Run API typecheck**

Run: `pnpm --filter @gaoge/app-api typecheck`  
Expected: PASS

- [ ] **Step 6: Commit teams API**

```bash
git add apps/api/src/app.module.ts apps/api/src/modules/teams
git commit -m "feat: add teams api module"
```

### Task 3: Match Rounds API Module

**Files:**

- Create: `apps/api/src/modules/match-rounds/match-rounds.controller.ts`
- Create: `apps/api/src/modules/match-rounds/match-rounds.module.ts`
- Create: `apps/api/src/modules/match-rounds/match-rounds.service.ts`
- Create: `apps/api/src/modules/match-rounds/dto/create-match-round.dto.ts`
- Create: `apps/api/src/modules/match-rounds/dto/update-match-round.dto.ts`
- Create: `apps/api/src/modules/match-rounds/match-rounds.service.spec.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: Write the failing match-rounds service tests**

```ts
import { MatchRoundsService } from './match-rounds.service'

describe('MatchRoundsService', () => {
  it('computes points from rank before create', async () => {
    const prisma = {
      $transaction: jest.fn(async (callback) =>
        callback({
          matchRound: { create: jest.fn().mockResolvedValue({ id: 1 }) },
          matchRoundResult: { createMany: jest.fn().mockResolvedValue({ count: 3 }) },
        }),
      ),
    } as any

    const service = new MatchRoundsService(prisma)

    await service.create({
      matchDate: '2026-04-29T00:00:00.000Z',
      results: [
        { teamId: 1, rank: 1 },
        { teamId: 2, rank: 2 },
        { teamId: 3, rank: 3 },
      ],
    } as any)

    const tx = await prisma.$transaction.mock.calls[0][0]({
      matchRound: { create: jest.fn().mockResolvedValue({ id: 1 }) },
      matchRoundResult: { createMany: jest.fn().mockResolvedValue({ count: 3 }) },
    })

    expect(tx).toBeDefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @gaoge/app-api test -- match-rounds.service.spec.ts --runInBand`  
Expected: FAIL because the module does not exist yet

- [ ] **Step 3: Implement DTOs and service validation**

```ts
export class MatchRoundResultDto {
  @Type(() => Number)
  @IsInt()
  teamId: number

  @Type(() => Number)
  @IsIn([1, 2, 3])
  rank: 1 | 2 | 3
}

export class CreateMatchRoundDto {
  @Type(() => Date)
  @IsDate()
  matchDate: Date

  @IsOptional()
  @IsString()
  venue?: string

  @IsOptional()
  @IsString()
  remark?: string

  @ValidateNested({ each: true })
  @Type(() => MatchRoundResultDto)
  results: MatchRoundResultDto[]
}
```

```ts
function mapRankToPoints(rank: 1 | 2 | 3) {
  return rank === 1 ? 2 : rank === 2 ? 1 : 0
}

function assertValidResults(results: MatchRoundResultDto[]) {
  if (results.length !== 3) {
    throw new BadRequestException('一场比赛必须包含 3 支球队结果')
  }

  const teamIds = new Set(results.map((item) => item.teamId))
  const ranks = new Set(results.map((item) => item.rank))

  if (teamIds.size !== 3) {
    throw new BadRequestException('同一场比赛不能重复选择球队')
  }

  if (![1, 2, 3].every((rank) => ranks.has(rank as 1 | 2 | 3))) {
    throw new BadRequestException('名次必须且只能为 1、2、3')
  }
}
```

- [ ] **Step 4: Implement controller and module**

```ts
@Controller('match-rounds')
export class MatchRoundsController {
  constructor(private readonly matchRoundsService: MatchRoundsService) {}

  @Get()
  findAll(@Query() query: Record<string, string | undefined>) {
    return this.matchRoundsService.findAll(query)
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.matchRoundsService.findOne(id)
  }
}
```

- [ ] **Step 5: Rerun tests and typecheck**

Run: `pnpm --filter @gaoge/app-api test -- match-rounds.service.spec.ts --runInBand`  
Expected: PASS

Run: `pnpm --filter @gaoge/app-api typecheck`  
Expected: PASS

- [ ] **Step 6: Commit match-rounds API**

```bash
git add apps/api/src/app.module.ts apps/api/src/modules/match-rounds
git commit -m "feat: add match rounds api module"
```

### Task 4: Admin Team Page

**Files:**

- Create: `apps/admin/src/api/teams/index.ts`
- Create: `apps/admin/src/views/gaoge/team/auth.ts`
- Create: `apps/admin/src/views/gaoge/team/index.vue`
- Create: `apps/admin/src/views/gaoge/team/model/defaults.ts`
- Create: `apps/admin/src/views/gaoge/team/model/mapper.ts`
- Create: `apps/admin/src/views/gaoge/team/model/types.ts`
- Create: `apps/admin/src/views/gaoge/team/schemas/form.ts`
- Create: `apps/admin/src/views/gaoge/team/schemas/search.ts`
- Create: `apps/admin/src/views/gaoge/team/schemas/table.ts`
- Create: `apps/admin/src/views/gaoge/team/components/TeamFormDialog.vue`

- [ ] **Step 1: Create the admin team API wrapper**

```ts
import type { Team, TeamListParams, TeamPayload } from '@gaoge/shared-types'
import api from '../index'

export default {
  list: (params?: TeamListParams) => api.get<Team[]>('/teams', { params }),
  create: (data: TeamPayload) => api.post<Team>('/teams', data),
  update: (id: number, data: TeamPayload) => api.patch<Team>(`/teams/${id}`, data),
  remove: (id: number) => api.delete(`/teams/${id}`),
}
```

- [ ] **Step 2: Create the page model and schemas**

```ts
export interface TeamSearch {
  keyword: string
}

export interface TeamFormModel {
  id?: number
  name: string
  slogan: string
  sponsorName: string
  sort: number
}
```

```ts
export const TEAM_TABLE_COLUMNS: TableColumn[] = [
  { label: '名称', prop: 'name', width: 160 },
  { label: 'Slogan', prop: 'slogan', width: 180 },
  { label: '赞助商名称', prop: 'sponsorName', width: 180 },
  { label: '排序', prop: 'sort', width: 90, align: 'center' },
  { label: '创建时间', prop: 'createdAt', width: 170, slot: 'createdAt' },
  { label: '更新时间', prop: 'updatedAt', width: 170, slot: 'updatedAt' },
]
```

- [ ] **Step 3: Create the page and dialog using the player page pattern**

```vue
<EsSearch v-model="search" :fields="searchFields" @search="handleSearch" />
<EsListToolbar>
  <template #actions>
    <ElButton v-auth="TEAM_PERMISSIONS.create" type="primary" plain @click="handleAdd">
      新增球队
    </ElButton>
  </template>
</EsListToolbar>
<EsTable
  v-model:page="page"
  v-model:page-size="pageSize"
  :columns="TEAM_TABLE_COLUMNS"
  :data="tableData"
  :total="total"
  :loading="loading"
  @action-click="handleTableAction"
  @pagination-change="handlePaginationChange"
/>
```

- [ ] **Step 4: Run admin typecheck**

Run: `pnpm --filter @gaoge/app-admin typecheck`  
Expected: PASS

- [ ] **Step 5: Commit admin team page**

```bash
git add apps/admin/src/api/teams apps/admin/src/views/gaoge/team
git commit -m "feat: add team info admin page"
```

### Task 5: Admin Match Round Page and Routes

**Files:**

- Create: `apps/admin/src/api/match-rounds/index.ts`
- Create: `apps/admin/src/views/gaoge/match_round/auth.ts`
- Create: `apps/admin/src/views/gaoge/match_round/index.vue`
- Create: `apps/admin/src/views/gaoge/match_round/model/defaults.ts`
- Create: `apps/admin/src/views/gaoge/match_round/model/mapper.ts`
- Create: `apps/admin/src/views/gaoge/match_round/model/types.ts`
- Create: `apps/admin/src/views/gaoge/match_round/schemas/form.ts`
- Create: `apps/admin/src/views/gaoge/match_round/schemas/search.ts`
- Create: `apps/admin/src/views/gaoge/match_round/schemas/table.ts`
- Create: `apps/admin/src/views/gaoge/match_round/components/MatchRoundFormDialog.vue`
- Modify: `apps/admin/src/router/modules/gaoge/index.ts`

- [ ] **Step 1: Create the admin match-round API wrapper**

```ts
import type { MatchRound, MatchRoundPayload } from '@gaoge/shared-types'
import api from '../index'

export default {
  list: (params?: Record<string, string | undefined>) =>
    api.get<{ list: MatchRound[]; total: number }>('/match-rounds', { params }),
  detail: (id: number) => api.get<MatchRound>(`/match-rounds/${id}`),
  create: (data: MatchRoundPayload) => api.post<MatchRound>('/match-rounds', data),
  update: (id: number, data: MatchRoundPayload) =>
    api.patch<MatchRound>(`/match-rounds/${id}`, data),
  remove: (id: number) => api.delete(`/match-rounds/${id}`),
}
```

- [ ] **Step 2: Define form model and result rows**

```ts
export interface MatchRoundResultFormItem {
  teamId: number
  teamName: string
  rank: 1 | 2 | 3 | null
}

export interface MatchRoundFormModel {
  id?: number
  matchDate: string
  venue: string
  remark: string
  results: MatchRoundResultFormItem[]
}
```

- [ ] **Step 3: Build the dialog UI with fixed three-team result editing**

```vue
<ElFormItem label="比赛日期" prop="matchDate">
  <ElDatePicker
    v-model="model.matchDate"
    type="datetime"
    value-format="YYYY-MM-DDTHH:mm:ss[Z]"
    class="w-full"
  />
</ElFormItem>

<div v-for="item in model.results" :key="item.teamId" class="grid grid-cols-[140px_1fr_80px] gap-3">
  <div>{{ item.teamName }}</div>
  <ElSelect v-model="item.rank" placeholder="选择名次">
    <ElOption :value="1" label="第 1 名" />
    <ElOption :value="2" label="第 2 名" />
    <ElOption :value="3" label="第 3 名" />
  </ElSelect>
  <div>{{ item.rank === 1 ? 2 : item.rank === 2 ? 1 : item.rank === 3 ? 0 : '-' }} 分</div>
</div>
```

- [ ] **Step 4: Add the two new routes**

```ts
{
  path: 'team',
  name: 'team',
  component: () => import('@/views/gaoge/team/index.vue'),
  meta: { title: '球队信息' },
},
{
  path: 'match-round',
  name: 'matchRound',
  component: () => import('@/views/gaoge/match_round/index.vue'),
  meta: { title: '比赛信息' },
},
```

- [ ] **Step 5: Run final verification**

Run: `pnpm --filter @gaoge/app-api typecheck`  
Expected: PASS

Run: `pnpm --filter @gaoge/app-admin typecheck`  
Expected: PASS

Run: `pnpm --filter @gaoge/app-api test -- teams.service.spec.ts match-rounds.service.spec.ts --runInBand`  
Expected: PASS

- [ ] **Step 6: Commit admin match-round page and routes**

```bash
git add apps/admin/src/api/match-rounds \
  apps/admin/src/views/gaoge/match_round \
  apps/admin/src/router/modules/gaoge/index.ts
git commit -m "feat: add match info admin page"
```
