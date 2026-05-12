# Miniapp Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild miniapp silent login around `User` + `FootballPlayer` binding, expose `/auth/miniapp/login`, `/miniapp/me`, and football player binding APIs, and switch the miniapp client from `thirdSessionKey` to Bearer token auth.

**Architecture:** Keep `/auth/miniapp/login` and refresh/logout inside the existing auth module, but move miniapp session reads and football binding routes into a dedicated `MiniappModule`. Persist miniapp identity in `User`, link football business identity through `FootballPlayer.userId`, and let the miniapp client bootstrap by silent login plus `/miniapp/me` instead of a standalone login page.

**Tech Stack:** NestJS, Prisma, Jest, Vue 3, uni-app, Pinia, workspace shared types

---

## File Structure

### Backend contract and persistence

- Modify: `packages/shared/types/src/auth.ts`
- Modify: `packages/shared/types/src/player.ts`
- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/<timestamp>_miniapp_login_player_binding/migration.sql`
- Modify: `apps/api/src/modules/auth/dto/login.dto.ts`
- Modify: `apps/api/src/modules/auth/services/auth.service.ts`
- Create: `apps/api/src/modules/auth/services/auth.service.spec.ts`

### Miniapp session and binding APIs

- Create: `apps/api/src/modules/miniapp/miniapp.module.ts`
- Create: `apps/api/src/modules/miniapp/miniapp.controller.ts`
- Create: `apps/api/src/modules/miniapp/miniapp.controller.spec.ts`
- Create: `apps/api/src/modules/miniapp/miniapp.service.ts`
- Create: `apps/api/src/modules/miniapp/miniapp.service.spec.ts`
- Create: `apps/api/src/modules/miniapp/dto/bind-football-player.dto.ts`
- Modify: `apps/api/src/app.module.ts`

### Miniapp client session layer

- Modify: `apps/miniapp/src/api/auth/index.ts`
- Modify: `apps/miniapp/src/api/request.ts`
- Modify: `apps/miniapp/src/store/auth/index.ts`
- Modify: `apps/miniapp/src/utils/storage.ts`

### Miniapp bootstrap and presentation

- Modify: `apps/miniapp/src/App.vue`
- Modify: `apps/miniapp/src/plugins/permission.ts`
- Modify: `apps/miniapp/src/router/index.ts`
- Create: `apps/miniapp/src/pages/profile/index.vue`
- Modify: `apps/miniapp/src/pages/home/index.vue`

## Task 1: Rework backend miniapp auth contract and persistence

**Files:**

- Modify: `packages/shared/types/src/auth.ts`
- Modify: `packages/shared/types/src/player.ts`
- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/<timestamp>_miniapp_login_player_binding/migration.sql`
- Modify: `apps/api/src/modules/auth/dto/login.dto.ts`
- Modify: `apps/api/src/modules/auth/services/auth.service.ts`
- Test: `apps/api/src/modules/auth/services/auth.service.spec.ts`

- [ ] **Step 1: Write the failing auth service test for unbound and bound miniapp login**

```ts
import { AuthService } from './auth.service'

describe('AuthService miniapp login', () => {
  const createService = () => {
    const prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      player: {
        findFirst: jest.fn(),
      },
      refreshToken: {
        create: jest.fn(),
      },
    }
    const wechatService = {
      getSessionByCode: jest.fn(),
    }
    const jwtService = {
      signAsync: jest.fn(),
    }

    return {
      prisma,
      wechatService,
      jwtService,
      service: new AuthService(wechatService as any, prisma as any, jwtService as any),
    }
  }

  it('creates a miniapp user and returns an unbound payload', async () => {
    const { service, prisma, wechatService, jwtService } = createService()

    wechatService.getSessionByCode.mockResolvedValue({
      openid: 'wx-openid-1',
      session_key: 'session-key',
      unionid: 'union-1',
    })
    prisma.user.findUnique.mockResolvedValueOnce(null)
    prisma.user.create.mockResolvedValue({
      id: 1,
      openid: 'wx-openid-1',
      unionid: 'union-1',
      account: null,
      nickname: null,
      avatarUrl: null,
      phone: null,
      role: 'user',
      status: 'active',
      lastLoginAt: new Date('2026-05-12T00:00:00.000Z'),
      deletedAt: null,
    })
    prisma.player.findFirst.mockResolvedValue(null)
    prisma.refreshToken.create.mockResolvedValue({ id: 11 })
    jwtService.signAsync
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token')

    await expect(service.wechatLogin({ code: 'valid-code' })).resolves.toMatchObject({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: {
        openid: 'wx-openid-1',
        isBound: false,
      },
      binding: null,
    })
  })

  it('returns binding info when the miniapp user is already linked to a football player', async () => {
    const { service, prisma, wechatService, jwtService } = createService()

    wechatService.getSessionByCode.mockResolvedValue({
      openid: 'wx-openid-2',
      session_key: 'session-key',
      unionid: 'union-2',
    })
    prisma.user.findUnique.mockResolvedValueOnce({
      id: 2,
      openid: 'wx-openid-2',
      unionid: 'union-2',
      account: null,
      nickname: null,
      avatarUrl: null,
      phone: null,
      role: 'user',
      status: 'active',
      lastLoginAt: new Date('2026-05-11T00:00:00.000Z'),
      deletedAt: null,
    })
    prisma.user.update.mockResolvedValue({
      id: 2,
      openid: 'wx-openid-2',
      unionid: 'union-2',
      account: null,
      nickname: null,
      avatarUrl: null,
      phone: null,
      role: 'user',
      status: 'active',
      lastLoginAt: new Date('2026-05-12T00:00:00.000Z'),
      deletedAt: null,
    })
    prisma.player.findFirst.mockResolvedValue({
      id: 18,
      playerNumber: 7,
      nickname: '齐达内',
      avatarUrl: null,
      subTeam: 'real',
      status: 'active',
    })
    prisma.refreshToken.create.mockResolvedValue({ id: 12 })
    jwtService.signAsync
      .mockResolvedValueOnce('access-token-2')
      .mockResolvedValueOnce('refresh-token-2')

    await expect(service.wechatLogin({ code: 'bound-code' })).resolves.toMatchObject({
      user: {
        id: 2,
        isBound: true,
      },
      binding: {
        playerId: 18,
        playerNumber: 7,
        nickname: '齐达内',
      },
    })
  })
})
```

- [ ] **Step 2: Run the focused auth service test to confirm the current contract fails**

Run:

```bash
pnpm --filter @gaoge/app-api test -- --runInBand src/modules/auth/services/auth.service.spec.ts
```

Expected: FAIL because `MiniappLoginDto` and `AuthService.wechatLogin()` still return the old `AuthLoginResponse` shape without `isBound` or `binding`.

- [ ] **Step 3: Implement the shared types, Prisma relation, migration, and auth service response**

Update `packages/shared/types/src/auth.ts` to introduce a dedicated miniapp response contract:

```ts
export interface MiniappBindingSummary {
  playerId: number
  playerNumber: number | null
  nickname: string
  avatarUrl: string | null
  subTeam: string | null
  status: string
}

export interface MiniappAuthUser {
  id: number
  openid: string
  nickname: string | null
  avatarUrl: string | null
  phone: string | null
  status: UserStatus
  isBound: boolean
}

export interface MiniappLoginResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
  user: MiniappAuthUser
  binding: MiniappBindingSummary | null
}

export interface MiniappMeResponse {
  user: MiniappAuthUser
  binding: MiniappBindingSummary | null
}

export interface MiniappBindOption {
  playerId: number
  playerNumber: number | null
  nickname: string
  subTeam: string | null
}

export interface MiniappBindOptionsResponse {
  list: MiniappBindOption[]
}
```

Update `packages/shared/types/src/player.ts` so runtime consumers stop depending on `openid` and can read player bindings:

```ts
export interface Player {
  id: number
  openid: string | null
  userId: number | null
  playerNumber: number | null
  nickname: string
  avatarUrl: string | null
  subTeam: string | null
  status: PlayerStatus
  createdAt: DateTimeString
  updatedAt: DateTimeString
}
```

Update `apps/api/prisma/schema.prisma` to model the `User <-> Player` relation explicitly:

```prisma
model User {
  id            Int     @id @default(autoincrement())
  openid        String? @unique
  unionid       String? @unique
  footballPlayer Player?
  refreshTokens RefreshToken[]
  // ...
}

model Player {
  id        Int    @id @default(autoincrement())
  openid    String? @unique
  userId    Int?    @unique
  user      User?   @relation(fields: [userId], references: [id])
  // ...
}
```

Create a Prisma migration that backfills `Player.userId` from matching `User.openid` before runtime code switches over:

```sql
ALTER TABLE "Player"
ADD COLUMN IF NOT EXISTS "userId" INTEGER;

UPDATE "Player" p
SET "userId" = u."id"
FROM "User" u
WHERE p."openid" IS NOT NULL
  AND p."openid" = u."openid"
  AND p."userId" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "Player_userId_key" ON "Player"("userId");
ALTER TABLE "Player"
ADD CONSTRAINT "Player_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
```

Shrink `MiniappLoginDto` to `code` only and update `AuthService.wechatLogin()` to build the new response shape:

```ts
export class MiniappLoginDto {
  @IsString()
  @IsNotEmpty()
  code: string
}

async wechatLogin(loginDto: MiniappLoginDto): Promise<MiniappLoginResponse> {
  const session = await this.wechatService.getSessionByCode(loginDto.code)
  const user = await this.upsertMiniappUser(session)
  const binding = await this.prisma.player.findFirst({
    where: { userId: user.id },
    select: {
      id: true,
      playerNumber: true,
      nickname: true,
      avatarUrl: true,
      subTeam: true,
      status: true,
    },
  })
  const tokens = await this.generateTokens(user)

  return {
    ...tokens,
    user: {
      id: user.id,
      openid: user.openid!,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
      status: user.status,
      isBound: Boolean(binding),
    },
    binding: binding
      ? {
          playerId: binding.id,
          playerNumber: binding.playerNumber,
          nickname: binding.nickname,
          avatarUrl: binding.avatarUrl,
          subTeam: binding.subTeam,
          status: binding.status,
        }
      : null,
  }
}
```

- [ ] **Step 4: Re-run the focused test and the two affected typechecks**

Run:

```bash
pnpm --filter @gaoge/app-api test -- --runInBand src/modules/auth/services/auth.service.spec.ts
pnpm --filter @gaoge/app-api typecheck
pnpm --filter @gaoge/shared-types typecheck
```

Expected: PASS for the new auth service spec and both typechecks complete without contract errors.

- [ ] **Step 5: Commit the backend auth contract slice**

```bash
git add packages/shared/types/src/auth.ts packages/shared/types/src/player.ts apps/api/prisma/schema.prisma apps/api/prisma/migrations apps/api/src/modules/auth/dto/login.dto.ts apps/api/src/modules/auth/services/auth.service.ts apps/api/src/modules/auth/services/auth.service.spec.ts
git commit -m "feat(api): add miniapp login contract"
```

## Task 2: Add miniapp session and football player binding APIs

**Files:**

- Create: `apps/api/src/modules/miniapp/miniapp.module.ts`
- Create: `apps/api/src/modules/miniapp/miniapp.controller.ts`
- Create: `apps/api/src/modules/miniapp/miniapp.controller.spec.ts`
- Create: `apps/api/src/modules/miniapp/miniapp.service.ts`
- Create: `apps/api/src/modules/miniapp/miniapp.service.spec.ts`
- Create: `apps/api/src/modules/miniapp/dto/bind-football-player.dto.ts`
- Modify: `apps/api/src/app.module.ts`
- Test: `apps/api/src/modules/miniapp/miniapp.service.spec.ts`

- [ ] **Step 1: Write the failing miniapp service tests for `me`, bind options, and first-time binding**

```ts
import { ConflictException, NotFoundException } from '@nestjs/common'

import { MiniappService } from './miniapp.service'

describe('MiniappService', () => {
  const createService = () => {
    const prisma = {
      user: {
        findUnique: jest.fn(),
      },
      player: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn((work: (tx: any) => Promise<unknown>) => work(prisma)),
    }

    return {
      prisma,
      service: new MiniappService(prisma as any),
    }
  }

  it('returns an unbound me response when no player is linked', async () => {
    const { prisma, service } = createService()

    prisma.user.findUnique.mockResolvedValue({
      id: 3,
      openid: 'wx-openid-3',
      nickname: null,
      avatarUrl: null,
      phone: null,
      status: 'active',
    })
    prisma.player.findFirst.mockResolvedValue(null)

    await expect(service.getMe(3)).resolves.toEqual({
      user: {
        id: 3,
        openid: 'wx-openid-3',
        nickname: null,
        avatarUrl: null,
        phone: null,
        status: 'active',
        isBound: false,
      },
      binding: null,
    })
  })

  it('lists only unbound football players as bind options', async () => {
    const { prisma, service } = createService()

    prisma.player.findMany.mockResolvedValue([
      { id: 9, playerNumber: 7, nickname: '齐达内', subTeam: 'real' },
      { id: 10, playerNumber: 10, nickname: '劳塔罗', subTeam: 'inter' },
    ])

    await expect(service.listBindOptions()).resolves.toEqual({
      list: [
        { playerId: 9, playerNumber: 7, nickname: '齐达内', subTeam: 'real' },
        { playerId: 10, playerNumber: 10, nickname: '劳塔罗', subTeam: 'inter' },
      ],
    })
  })

  it('rejects a second binding attempt for the same user', async () => {
    const { prisma, service } = createService()

    prisma.player.findFirst.mockResolvedValueOnce({ id: 88, userId: 3 })

    await expect(service.bindFootballPlayer(3, 7)).rejects.toBeInstanceOf(ConflictException)
  })

  it('rejects binding to a missing player number', async () => {
    const { prisma, service } = createService()

    prisma.player.findFirst.mockResolvedValueOnce(null)
    prisma.player.findFirst.mockResolvedValueOnce(null)

    await expect(service.bindFootballPlayer(3, 101)).rejects.toBeInstanceOf(NotFoundException)
  })
})
```

- [ ] **Step 2: Run the focused miniapp service test to confirm the API is still missing**

Run:

```bash
pnpm --filter @gaoge/app-api test -- --runInBand src/modules/miniapp/miniapp.service.spec.ts
```

Expected: FAIL because the `MiniappModule` files and service methods do not exist yet.

- [ ] **Step 3: Implement the miniapp module, controller, DTO, and service**

Create the DTO and controller routes exactly matching the spec:

```ts
export class BindFootballPlayerDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  playerNumber: number
}

@Controller('miniapp')
@UseGuards(JwtAuthGuard)
export class MiniappController {
  constructor(private readonly miniappService: MiniappService) {}

  @Get('me')
  getMe(@Req() request: { user: { id: number } }) {
    return this.miniappService.getMe(request.user.id)
  }

  @Get('football-player/bind-options')
  listBindOptions() {
    return this.miniappService.listBindOptions()
  }

  @Post('football-player/bind')
  bindFootballPlayer(@Req() request: { user: { id: number } }, @Body() dto: BindFootballPlayerDto) {
    return this.miniappService.bindFootballPlayer(request.user.id, dto.playerNumber)
  }
}
```

Implement `MiniappService` around one response builder so `/miniapp/me` and `bind` share exactly the same output:

```ts
@Injectable()
export class MiniappService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: number): Promise<MiniappMeResponse> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user || user.deletedAt || user.status !== 'active') {
      throw new UnauthorizedException('用户不存在或已被禁用')
    }

    return this.buildMeResponse(user.id)
  }

  async listBindOptions(): Promise<MiniappBindOptionsResponse> {
    const list = await this.prisma.player.findMany({
      where: {
        userId: null,
        playerNumber: { not: null },
      },
      select: {
        id: true,
        playerNumber: true,
        nickname: true,
        subTeam: true,
      },
      orderBy: { playerNumber: 'asc' },
    })

    return {
      list: list.map((item) => ({
        playerId: item.id,
        playerNumber: item.playerNumber,
        nickname: item.nickname,
        subTeam: item.subTeam,
      })),
    }
  }

  async bindFootballPlayer(userId: number, playerNumber: number): Promise<MiniappMeResponse> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.player.findFirst({ where: { userId } })
      if (existing) {
        throw new ConflictException('当前用户已绑定号码')
      }

      const player = await tx.player.findFirst({ where: { playerNumber } })
      if (!player) {
        throw new NotFoundException('号码不存在')
      }
      if (player.userId) {
        throw new ConflictException('号码已被绑定')
      }

      await tx.player.update({
        where: { id: player.id },
        data: { userId },
      })

      return this.buildMeResponse(userId, tx)
    })
  }
}
```

Wire the module into `apps/api/src/app.module.ts`:

```ts
imports: [
  ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env.local', '.env'] }),
  PrismaModule,
  WechatModule,
  HealthModule,
  BasketballModule,
  FootballModule,
  MiniappModule,
  AuthModule,
  BannerModule,
  SystemModule,
]
```

- [ ] **Step 4: Run the new miniapp service test, route metadata test, and API typecheck**

Run:

```bash
pnpm --filter @gaoge/app-api test -- --runInBand src/modules/miniapp/miniapp.service.spec.ts src/modules/miniapp/miniapp.controller.spec.ts
pnpm --filter @gaoge/app-api typecheck
```

Expected: PASS, with the controller spec confirming `/miniapp`, `/miniapp/me`, `/miniapp/football-player/bind-options`, and `/miniapp/football-player/bind`.

- [ ] **Step 5: Commit the miniapp API slice**

```bash
git add apps/api/src/app.module.ts apps/api/src/modules/miniapp
git commit -m "feat(api): add miniapp binding endpoints"
```

## Task 3: Replace the miniapp client auth layer with token-based silent login

**Files:**

- Modify: `apps/miniapp/src/api/auth/index.ts`
- Modify: `apps/miniapp/src/api/request.ts`
- Modify: `apps/miniapp/src/store/auth/index.ts`
- Modify: `apps/miniapp/src/utils/storage.ts`
- Test: `apps/miniapp/src/store/auth/index.ts` via `vue-tsc`

- [ ] **Step 1: Write the failing miniapp auth store against the new backend contract**

Replace the old `thirdSessionKey` store API with the shape the app needs after the backend work:

```ts
import type { MiniappLoginResponse, MiniappMeResponse } from '@gaoge/shared-types'

import { loginByCode, logoutReq, refreshTokenReq, requestMe } from '@/api/auth'

const useAuthStore = defineStore('auth', () => {
  const accessToken = ref('')
  const refreshToken = ref('')
  const me = ref<MiniappMeResponse | null>(null)
  const bootstrapping = ref(false)

  const setSession = (payload: MiniappLoginResponse) => {
    accessToken.value = payload.accessToken
    refreshToken.value = payload.refreshToken
    me.value = {
      user: payload.user,
      binding: payload.binding,
    }
  }

  const silentLogin = async () => {
    const { code } = await uni.login()
    const payload = await loginByCode({ code })
    setSession(payload)
    return payload
  }

  const fetchMe = async () => {
    me.value = await requestMe()
    return me.value
  }

  return {
    accessToken,
    refreshToken,
    me,
    bootstrapping,
    setSession,
    silentLogin,
    fetchMe,
  }
})
```

- [ ] **Step 2: Run miniapp typecheck to capture the missing auth client and request helpers**

Run:

```bash
pnpm --filter @gaoge/app-miniapp typecheck
```

Expected: FAIL because `loginByCode`, `requestMe`, `refreshTokenReq`, and the new store fields do not exist yet, and `request.ts` still emits `thirdSessionKey`.

- [ ] **Step 3: Implement auth API helpers, token persistence, and request refresh logic**

Implement `apps/miniapp/src/api/auth/index.ts` against the new backend routes:

```ts
import type {
  MiniappBindOptionsResponse,
  MiniappLoginResponse,
  MiniappMeResponse,
} from '@gaoge/shared-types'

import api from '@/api/request'

export const loginByCode = (payload: { code: string }) =>
  api.jsonPost<MiniappLoginResponse>('/auth/miniapp/login', payload, { skipAuth: true })

export const refreshTokenReq = (refreshToken: string) =>
  api.jsonPost<{ accessToken: string; refreshToken: string }>(
    '/auth/refresh-token',
    { refreshToken },
    { skipAuth: true, skipRefresh: true },
  )

export const requestMe = () => api.get<MiniappMeResponse>('/miniapp/me')

export const requestBindOptions = () =>
  api.get<MiniappBindOptionsResponse>('/miniapp/football-player/bind-options')

export const bindFootballPlayer = (playerNumber: number) =>
  api.jsonPost<MiniappMeResponse>('/miniapp/football-player/bind', { playerNumber })

export const logoutReq = () => api.post<{ message: string }>('/auth/logout')
```

Update `apps/miniapp/src/api/request.ts` to emit Bearer tokens and refresh once on `401`:

```ts
interface RequestOption {
  timeout?: number
  header?: Record<string, string>
  loading?: boolean
  toast?: boolean
  json?: boolean
  skipAuth?: boolean
  skipRefresh?: boolean
}

let refreshPromise: Promise<string | null> | null = null

const createHeaders = (config: InternalRequestConfig) => {
  const token = storage.get('accessToken')

  return {
    'content-type': config.json
      ? 'application/json;charset=UTF-8'
      : 'application/x-www-form-urlencoded',
    ...(config.skipAuth || !token ? {} : { Authorization: `Bearer ${token}` }),
    ...(config.header || {}),
  }
}

const refreshAccessToken = async (baseURL: string) => {
  if (!storage.get('refreshToken')) return null
  if (!refreshPromise) {
    refreshPromise = refreshTokenReq(storage.get('refreshToken'))
      .then((payload) => {
        storage.set('accessToken', payload.accessToken)
        storage.set('refreshToken', payload.refreshToken)
        return payload.accessToken
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}
```

Keep `storage.ts` string-safe and add explicit token cleanup:

```ts
export const storage = {
  set(key: string, value: string) {
    uni.setStorageSync(key, value)
  },
  get(key: string) {
    return uni.getStorageSync(key) as string
  },
  remove(key: string) {
    uni.removeStorageSync(key)
  },
  clearAuth() {
    uni.removeStorageSync('accessToken')
    uni.removeStorageSync('refreshToken')
  },
}
```

- [ ] **Step 4: Re-run miniapp typecheck after the request layer and store compile against the new contract**

Run:

```bash
pnpm --filter @gaoge/app-miniapp typecheck
```

Expected: PASS, with no remaining references to `thirdSessionKey`, `getSession`, or `/auth/profile`.

- [ ] **Step 5: Commit the miniapp auth layer rewrite**

```bash
git add apps/miniapp/src/api/auth/index.ts apps/miniapp/src/api/request.ts apps/miniapp/src/store/auth/index.ts apps/miniapp/src/utils/storage.ts
git commit -m "feat(miniapp): add silent login session layer"
```

## Task 4: Bootstrap silent login, clean route guards, and expose current user state in the UI

**Files:**

- Modify: `apps/miniapp/src/App.vue`
- Modify: `apps/miniapp/src/plugins/permission.ts`
- Modify: `apps/miniapp/src/router/index.ts`
- Create: `apps/miniapp/src/pages/profile/index.vue`
- Modify: `apps/miniapp/src/pages/home/index.vue`
- Test: `apps/miniapp/src/pages/profile/index.vue` via `vue-tsc`

- [ ] **Step 1: Write the failing bootstrap and profile page integration**

Create a real `pages/profile/index.vue` and use the new auth store contract so the current app stops depending on a missing login page:

```vue
<script setup lang="ts">
import { useAuthStore } from '@/store'

const authStore = useAuthStore()
const me = computed(() => authStore.me)
</script>

<template>
  <view class="page profile-page">
    <CustomNavbar title="我的" :show-back="false" />
    <view class="content">
      <view class="card">
        <text class="title">{{ me?.user.isBound ? '已绑定球员' : '未绑定球员' }}</text>
        <text class="desc">openid: {{ me?.user.openid || '-' }}</text>
        <text class="desc">号码: {{ me?.binding?.playerNumber ?? '未绑定' }}</text>
        <text class="desc">昵称: {{ me?.binding?.nickname ?? '未绑定' }}</text>
      </view>
    </view>
  </view>
</template>
```

Update `App.vue` to call `ensureSession()` on launch:

```ts
onLaunch(async () => {
  useAppStore().initSystemInfo()
  await useAuthStore().ensureSession()
})
```

- [ ] **Step 2: Run miniapp typecheck to confirm the app is still missing bootstrap helpers**

Run:

```bash
pnpm --filter @gaoge/app-miniapp typecheck
```

Expected: FAIL because `ensureSession()` and the new profile page/store wiring do not exist yet, and `permission.ts` still references `LOGIN_PATH`.

- [ ] **Step 3: Implement app bootstrap, simplify route permission, and show current session state**

Finish the store methods and remove login-page redirects from the route guard:

```ts
const ensureSession = async () => {
  if (bootstrapping.value) return
  bootstrapping.value = true

  try {
    if (accessToken.value) {
      await fetchMe()
      return
    }

    await silentLogin()
    await fetchMe()
  } finally {
    bootstrapping.value = false
  }
}

const logout = async () => {
  try {
    if (accessToken.value) {
      await logoutReq()
    }
  } finally {
    accessToken.value = ''
    refreshToken.value = ''
    me.value = null
    storage.clearAuth()
  }
}
```

Replace the old permission plugin with a guard that only blocks unknown routes and never redirects to a nonexistent login page:

```ts
import { ERROR404_PATH, isPathExists, removeQueryString } from '@/router'

export const hasPerm = (path = ''): boolean => {
  if (!isPathExists(path) && path !== '/') {
    uni.redirectTo({ url: ERROR404_PATH })
    return false
  }

  return true
}
```

Use `home/index.vue` to show whether the session is bound without triggering bind flows:

```vue
<script setup lang="ts">
import { useAuthStore } from '@/store'

const authStore = useAuthStore()
const me = computed(() => authStore.me)
</script>

<template>
  <view class="page">
    <CustomNavbar title="首页" :show-back="false" />
    <view class="panel">
      <text class="headline">{{
        me?.user.isBound ? '已完成登录并绑定球员' : '已完成登录，暂未绑定球员'
      }}</text>
      <text class="subline">当前 openid：{{ me?.user.openid || '-' }}</text>
    </view>
  </view>
</template>
```

- [ ] **Step 4: Run final API tests, both typechecks, and the root lint subset affected by the change**

Run:

```bash
pnpm --filter @gaoge/app-api test -- --runInBand src/modules/auth/services/auth.service.spec.ts src/modules/miniapp/miniapp.service.spec.ts src/modules/miniapp/miniapp.controller.spec.ts
pnpm --filter @gaoge/app-api typecheck
pnpm --filter @gaoge/shared-types typecheck
pnpm --filter @gaoge/app-miniapp typecheck
pnpm lint
```

Expected: PASS, and manual smoke in the WeChat devtools should show silent login on app launch plus correct bound/unbound status on the home and profile pages.

- [ ] **Step 5: Commit the bootstrap and UI integration slice**

```bash
git add apps/miniapp/src/App.vue apps/miniapp/src/plugins/permission.ts apps/miniapp/src/router/index.ts apps/miniapp/src/pages/home/index.vue apps/miniapp/src/pages/profile/index.vue apps/miniapp/src/store/auth/index.ts
git commit -m "feat(miniapp): surface current login state"
```

## Self-Review

### Spec coverage

- `uni.login` silent login: covered by Task 3 and Task 4.
- `User` as login main table: covered by Task 1.
- `FootballPlayer.userId` binding: covered by Task 1 and Task 2.
- `/miniapp/me`: covered by Task 2 and consumed in Task 3.
- bind options and first bind only: covered by Task 2.
- miniapp no unbind/rebind, admin-only reassignment: enforced by Task 2 through first-bind-only logic; admin UI changes are intentionally out of scope.
- current user info on miniapp side: surfaced in Task 4.

### Placeholder scan

- No `TODO`, `TBD`, or "implement later" placeholders remain.
- Every task names exact files, commands, and response shapes.

### Type consistency

- Shared response names are `MiniappLoginResponse`, `MiniappMeResponse`, `MiniappBindingSummary`, and `MiniappBindOptionsResponse`.
- Player binding always uses `FootballPlayer.userId`.
- Client requests point to `/auth/miniapp/login`, `/auth/refresh-token`, `/miniapp/me`, `/miniapp/football-player/bind-options`, and `/miniapp/football-player/bind`.
