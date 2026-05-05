# Miniapp Player Debug Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `apps/miniapp` 中新增一个可手动访问的球员列表调试页，并把通用请求层收敛到服务端真实响应结构 `{ code, data, errMsg }`。

**Architecture:** 先把请求层的响应解析提取成纯函数并通过单测做红绿验证，再让 `request.ts` 复用这组纯函数。随后补一个最小 `players` API 封装和独立调试页，仅展示加载、失败、空态和成功列表，不改首页入口或 tabBar。

**Tech Stack:** Vue 3, uni-app, TypeScript, Vitest (workspace binary), pnpm workspace

---

### Task 1: 抽离并验证请求层响应解析

**Files:**

- Create: `apps/miniapp/src/api/response.ts`
- Create: `apps/miniapp/src/api/response.spec.ts`
- Modify: `apps/miniapp/src/api/request.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'

import { extractResponseData, parseResponseEnvelope } from './response'

describe('response helpers', () => {
  it('unwraps a successful server envelope', () => {
    expect(
      extractResponseData({
        code: 0,
        data: { list: [{ id: 1, nickname: '齐达内' }], total: 1 },
        errMsg: '',
      }),
    ).toEqual({
      list: [{ id: 1, nickname: '齐达内' }],
      total: 1,
    })
  })

  it('throws server-side business errors with errMsg', () => {
    expect(() =>
      extractResponseData({
        code: 400,
        data: null,
        errMsg: '球员不存在',
      }),
    ).toThrow('球员不存在')
  })

  it('parses a string payload into the common envelope', () => {
    expect(parseResponseEnvelope('{"code":0,"data":{"ok":true},"errMsg":""}')).toEqual({
      code: 0,
      data: { ok: true },
      errMsg: '',
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
./node_modules/.pnpm/node_modules/.bin/vitest run apps/miniapp/src/api/response.spec.ts
```

Expected: FAIL because `apps/miniapp/src/api/response.ts` does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```ts
export interface ApiResponseEnvelope<T = unknown> {
  code: number
  data: T
  errMsg: string
}

export class ApiResponseError extends Error {
  code: number
  payload: ApiResponseEnvelope<unknown>

  constructor(payload: ApiResponseEnvelope<unknown>) {
    super(payload.errMsg || '请求失败')
    this.name = 'ApiResponseError'
    this.code = payload.code
    this.payload = payload
  }
}

export function parseResponseEnvelope(raw: unknown): ApiResponseEnvelope<unknown> {
  if (typeof raw === 'string') {
    try {
      return parseResponseEnvelope(JSON.parse(raw))
    } catch {
      return { code: 50000, data: null, errMsg: raw }
    }
  }

  if (
    typeof raw === 'object' &&
    raw !== null &&
    'code' in raw &&
    'data' in raw &&
    'errMsg' in raw
  ) {
    return raw as ApiResponseEnvelope<unknown>
  }

  return { code: 50000, data: null, errMsg: '请求失败' }
}

export function extractResponseData<T>(payload: ApiResponseEnvelope<T>): T {
  if (payload.code === 0) {
    return payload.data
  }

  throw new ApiResponseError(payload as ApiResponseEnvelope<unknown>)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
./node_modules/.pnpm/node_modules/.bin/vitest run apps/miniapp/src/api/response.spec.ts
```

Expected: PASS with 3 tests passed.

- [ ] **Step 5: Wire request.ts to the new helpers**

Use `parseResponseEnvelope` and `extractResponseData` inside `request.ts`, keep 401 handling, and switch toast message lookup to `errMsg`.

```ts
const resData = parseResponseEnvelope((response as any).data)

try {
  return extractResponseData<T>(resData)
} catch (error) {
  if (error instanceof ApiResponseError && error.code === 401) {
    storage.clearStorage()
    Toast('登录超时，请重新登录')
    reLaunch('/pages/login/index')
  }

  if (config.toast !== false) {
    const message = error instanceof ApiResponseError ? error.message : '请求失败'
    Toast(message)
  }

  return Promise.reject(error)
}
```

### Task 2: 补齐球员列表 API 封装

**Files:**

- Create: `apps/miniapp/src/api/football/players/index.ts`
- Modify: `apps/miniapp/src/api/index.ts`
- Modify: `apps/miniapp/src/api/request.ts`
- Reference: `packages/shared/types/src/player.ts`

- [ ] **Step 1: Write a failing API-shape test**

```ts
import { describe, expect, it } from 'vitest'

import { normalizePlayerListParams } from './players'

describe('players api params', () => {
  it('fills default page params for the debug page', () => {
    expect(normalizePlayerListParams()).toEqual({ page: 1, pageSize: 20 })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
./node_modules/.pnpm/node_modules/.bin/vitest run apps/miniapp/src/api/football/players/index.spec.ts
```

Expected: FAIL because the module/spec does not exist yet.

- [ ] **Step 3: Write the minimal API module**

```ts
import type { PlayerListParams, PlayerListResponse } from '@gaoge/shared-types'

import { get } from '@/api/request'

export const normalizePlayerListParams = (
  params: PlayerListParams = {},
): Required<Pick<PlayerListParams, 'page' | 'pageSize'>> & PlayerListParams => ({
  page: params.page ?? 1,
  pageSize: params.pageSize ?? 20,
  ...params,
})

export const getPlayerList = (params: PlayerListParams = {}) =>
  get<PlayerListResponse>('/football/players', normalizePlayerListParams(params))
```

- [ ] **Step 4: Re-export the API**

Append to `apps/miniapp/src/api/index.ts`:

```ts
export * from './football/players'
```

- [ ] **Step 5: Run tests to verify they pass**

Run:

```bash
./node_modules/.pnpm/node_modules/.bin/vitest run apps/miniapp/src/api/response.spec.ts apps/miniapp/src/api/football/players/index.spec.ts
```

Expected: PASS with all tests green.

### Task 3: 新增独立球员调试页并注册路由

**Files:**

- Create: `apps/miniapp/src/pages/football/player/index.vue`
- Modify: `apps/miniapp/src/pages.json`
- Reference: `apps/miniapp/src/pages/home/index.vue`

- [ ] **Step 1: Register the route**

Add to the main `pages` array in `apps/miniapp/src/pages.json`:

```json
{
  "path": "pages/football/player/index",
  "style": {
    "navigationBarTitleText": "球员列表"
  }
}
```

- [ ] **Step 2: Implement the page with explicit states**

```vue
<script setup lang="ts">
import type { Player } from '@gaoge/shared-types'

import { getPlayerList } from '@/api'

type PageStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error'

const status = ref<PageStatus>('idle')
const total = ref(0)
const players = ref<Player[]>([])

const loadPlayers = async () => {
  status.value = 'loading'

  try {
    const data = await getPlayerList()
    players.value = data.list
    total.value = data.total
    status.value = data.list.length > 0 ? 'success' : 'empty'
  } catch {
    status.value = 'error'
  }
}

onLoad(() => {
  loadPlayers()
})
</script>
```

Template requirements:

```vue
<CustomNavbar title="球员列表" />
<view v-if="status === 'loading'">加载中...</view>
<view v-else-if="status === 'error'">
  <text>请求失败，请重试</text>
  <button @click="loadPlayers">重新加载</button>
</view>
<view v-else-if="status === 'empty'">暂无球员数据</view>
<view v-else>
  <view>总数：{{ total }}</view>
  <view v-for="player in players" :key="player.id">
    <text>#{{ player.playerNumber ?? '-' }}</text>
    <text>{{ player.nickname || '-' }}</text>
    <text>{{ player.subTeam || '-' }}</text>
    <text>{{ player.status || '-' }}</text>
  </view>
</view>
```

- [ ] **Step 3: Run typecheck**

Run:

```bash
pnpm --filter @gaoge/app-miniapp typecheck
```

Expected: PASS, or surface only pre-existing unrelated failures with exact file references.

### Task 4: 最终验证

**Files:**

- Verify only: `apps/miniapp/src/api/**/*`
- Verify only: `apps/miniapp/src/pages/football/player/index.vue`
- Verify only: `apps/miniapp/src/pages.json`

- [ ] **Step 1: Run focused tests**

```bash
./node_modules/.pnpm/node_modules/.bin/vitest run apps/miniapp/src/api/response.spec.ts apps/miniapp/src/api/football/players/index.spec.ts
```

Expected: PASS.

- [ ] **Step 2: Run typecheck**

```bash
pnpm --filter @gaoge/app-miniapp typecheck
```

Expected: PASS, or a precise list of pre-existing failures if the workspace baseline is still dirty.

- [ ] **Step 3: Review route and API usage**

Check that:

- `pages/football/player/index` is registered exactly once
- the debug page imports `getPlayerList` from the shared miniapp API barrel
- the request layer now parses `{ code, data, errMsg }`
