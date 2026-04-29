# Player Info Adjustment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the player module so `openid` is optional, `playerNumber` is required and globally unique within `0~100`, and the admin list/search/form all match the new player information rules.

**Architecture:** Keep this slice focused on the existing single-table `Player` workflow. Update the Prisma model, shared contract, Nest DTO/service filtering, and the admin player page together so the API contract and UI stay in sync. Defer `Team`/`PlayerTeam` normalization and standings work to a later slice.

**Tech Stack:** Prisma, NestJS, class-validator, shared workspace types, Vue 3, Element Plus, TypeScript

---

### Task 1: Backend contract and persistence

**Files:**

- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/20260429_player_info_adjustment/migration.sql`
- Modify: `apps/api/src/modules/players/dto/create-player.dto.ts`
- Modify: `apps/api/src/modules/players/players.service.ts`
- Modify: `packages/shared/types/src/player.ts`
- Test: `apps/api/src/modules/players/players.service.spec.ts`

- [ ] **Step 1: Write the failing backend tests**

```ts
import { PlayersService } from './players.service'

describe('PlayersService', () => {
  it('matches keyword against nickname and player number only', async () => {
    const prisma = {
      player: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      $transaction: jest.fn((actions) => Promise.all(actions)),
    } as any

    const service = new PlayersService(prisma)

    await service.findAll({ keyword: '7' })

    expect(prisma.player.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([{ nickname: expect.any(Object) }, { playerNumber: 7 }]),
        }),
      }),
    )
  })

  it('accepts optional openid on create', async () => {
    const prisma = {
      player: {
        create: jest.fn().mockResolvedValue({ id: 1 }),
      },
    } as any

    const service = new PlayersService(prisma)

    await service.create({
      nickname: '高歌7号',
      playerNumber: 7,
    } as any)

    expect(prisma.player.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        openid: undefined,
        nickname: '高歌7号',
        playerNumber: 7,
      }),
    })
  })
})
```

- [ ] **Step 2: Run backend test to verify it fails**

Run: `pnpm --filter @gaoge/app-api test -- players.service.spec.ts --runInBand`  
Expected: FAIL because `playerNumber` fields and keyword behavior do not exist yet

- [ ] **Step 3: Implement the minimal backend changes**

```prisma
model Player {
  id           Int       @id @default(autoincrement())
  openid       String?   @unique
  playerNumber Int       @unique
  nickname     String    @unique
  realName     String?
  avatarUrl    String?
  subTeam      String?
  birthDate    DateTime?
  isAdmin      Boolean   @default(false)
  position     String?
  jerseySize   String?
  status       String    @default("active")
  remark       String?
  userId       Int?      @unique
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  @@index([playerNumber])
  @@index([nickname])
  @@index([subTeam])
}
```

```ts
export class CreatePlayerDto {
  @IsOptional()
  @IsString()
  openid?: string

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  playerNumber: number

  @IsString()
  nickname: string
}
```

```ts
function buildPlayerWhere(params: PlayerListParams) {
  const keyword = normalizeText(params.keyword)
  const subTeam = normalizeText(params.subTeam)
  const where: Prisma.PlayerWhereInput = {}

  if (keyword) {
    const nicknameCondition = {
      contains: keyword,
      mode: 'insensitive',
    } satisfies Prisma.StringFilter
    const numericKeyword = Number(keyword)

    where.OR = [{ nickname: nicknameCondition }]

    if (Number.isInteger(numericKeyword)) {
      where.OR.push({ playerNumber: numericKeyword })
    }
  }

  if (subTeam) {
    where.subTeam = subTeam
  }

  return where
}
```

- [ ] **Step 4: Run backend test to verify it passes**

Run: `pnpm --filter @gaoge/app-api test -- players.service.spec.ts --runInBand`  
Expected: PASS

- [ ] **Step 5: Commit backend slice**

```bash
git add apps/api/prisma/schema.prisma \
  apps/api/prisma/migrations/20260429_player_info_adjustment/migration.sql \
  apps/api/src/modules/players/dto/create-player.dto.ts \
  apps/api/src/modules/players/players.service.ts \
  apps/api/src/modules/players/players.service.spec.ts \
  packages/shared/types/src/player.ts
git commit -m "feat: update player api contract"
```

### Task 2: Admin player page

**Files:**

- Modify: `apps/admin/src/views/gaoge/player/model/types.ts`
- Modify: `apps/admin/src/views/gaoge/player/model/mapper.ts`
- Modify: `apps/admin/src/views/gaoge/player/model/defaults.ts`
- Modify: `apps/admin/src/views/gaoge/player/schemas/form.ts`
- Modify: `apps/admin/src/views/gaoge/player/schemas/search.ts`
- Modify: `apps/admin/src/views/gaoge/player/schemas/table.ts`
- Modify: `apps/admin/src/views/gaoge/player/components/PlayerForm.vue`
- Modify: `apps/admin/src/views/gaoge/player/components/PlayerFormDialog.vue`
- Modify: `apps/admin/src/views/gaoge/player/index.vue`

- [ ] **Step 1: Update admin model and payload mapping**

```ts
export interface PlayerFormModel {
  id?: number
  openid: string
  playerNumber: number | null
  nickname: string
  realName: string
  avatarUrl: string
  subTeam: string
  birthDate: string
  isAdmin: boolean
  position: string
  jerseySize: string
  status: string
  remark: string
}
```

```ts
export function buildPlayerPayload(model: PlayerFormModel): PlayerPayload {
  return {
    openid: normalizeText(model.openid),
    playerNumber: Number(model.playerNumber),
    nickname: model.nickname.trim(),
    realName: normalizeText(model.realName),
    avatarUrl: normalizeText(model.avatarUrl),
    subTeam: normalizeText(model.subTeam),
    birthDate: model.birthDate ? dayjs(model.birthDate).startOf('day').toISOString() : undefined,
    isAdmin: model.isAdmin,
    position: normalizeText(model.position),
    jerseySize: normalizeText(model.jerseySize),
    status: normalizeText(model.status) ?? 'active',
    remark: normalizeText(model.remark),
  }
}
```

- [ ] **Step 2: Update form and search schema**

```ts
export const PLAYER_FORM_RULES: FormRules<PlayerFormModel> = {
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
  playerNumber: [
    { required: true, message: '请输入球员号码', trigger: 'blur' },
    {
      validator: (_, value, callback) => {
        if (!Number.isInteger(value) || value < 0 || value > 100) {
          callback(new Error('球员号码需为 0 到 100 的整数'))
          return
        }
        callback()
      },
      trigger: 'blur',
    },
  ],
}
```

```ts
export function createPlayerSearchFields(ctx: PlayerSearchFieldContext): SearchField[] {
  return [
    {
      key: 'keyword',
      label: '关键词',
      type: 'input',
      placeholder: '昵称 / 号码',
    },
    {
      key: 'subTeam',
      label: '分队',
      type: 'select',
      placeholder: '全部',
      options: ctx.subTeamOptions,
    },
  ]
}
```

- [ ] **Step 3: Update list columns and form UI**

```ts
export const PLAYER_TABLE_COLUMNS: TableColumn[] = [
  { label: '号码', prop: 'playerNumber', width: 90, align: 'center' },
  { label: '头像', prop: 'avatarUrl', width: 88, slot: 'avatar', align: 'center' },
  { label: '昵称', prop: 'nickname', width: 140 },
  { label: '真实姓名', prop: 'realName', width: 120 },
  { label: '分队', prop: 'subTeam', width: 120 },
  { label: '备注', prop: 'remark', minWidth: 180 },
]
```

```vue
<ElCol :span="12">
  <ElFormItem label="球员号码" prop="playerNumber">
    <ElInputNumber v-model="model.playerNumber" :min="0" :max="100" class="w-full" />
  </ElFormItem>
</ElCol>
<ElCol :span="12">
  <ElFormItem label="OpenID" prop="openid">
    <ElInput v-model="model.openid" placeholder="请输入 OpenID（非必填）" />
  </ElFormItem>
</ElCol>
```

- [ ] **Step 4: Run admin typecheck to verify the page compiles**

Run: `pnpm --filter @gaoge/app-admin typecheck`  
Expected: PASS

- [ ] **Step 5: Commit admin slice**

```bash
git add apps/admin/src/views/gaoge/player
git commit -m "feat: update player admin page fields"
```

### Task 3: Full verification and integration

**Files:**

- Modify: `docs/superpowers/specs/2026-04-29-player-team-standings-design.md`

- [ ] **Step 1: Reconcile spec scope note**

```md
在实现后的 spec 或后续说明中明确：

- 本轮已完成 `playerNumber/openid/list/search/form` 调整
- `Team/PlayerTeam` 与积分榜设计仍保留为后续实现项
```

- [ ] **Step 2: Run end-to-end verification commands**

Run: `pnpm --filter @gaoge/app-api test -- players.service.spec.ts --runInBand`  
Expected: PASS

Run: `pnpm --filter @gaoge/app-api typecheck`  
Expected: PASS

Run: `pnpm --filter @gaoge/app-admin typecheck`  
Expected: PASS

- [ ] **Step 3: Commit final integration**

```bash
git add apps/api apps/admin packages/shared/types docs/superpowers/specs/2026-04-29-player-team-standings-design.md
git commit -m "feat: adjust player info management"
```
