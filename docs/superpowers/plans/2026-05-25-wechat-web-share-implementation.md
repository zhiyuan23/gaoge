# Wechat Web Share Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add stable WeChat in-app H5 share support for `apps/web` by exposing an official-account JSSDK signature API from `apps/api`, wiring route-based share metadata in the web app, and reapplying share data after SPA navigation.

**Architecture:** Keep the existing monorepo boundaries intact: `apps/api` gets a dedicated `wechat-share` module instead of reusing the miniapp `WechatService`, and `apps/web` keeps route-to-share metadata as static frontend data while encapsulating SDK loading, environment detection, and signature requests in a focused utility. Global integration happens once in the web app shell so individual pages stay free of SDK calls.

**Tech Stack:** NestJS 11, ConfigModule, class-validator, Vue 3, Vue Router 4, Vitest, Vue Test Utils, native `fetch`, native `crypto`

---

## File Structure

### API: official account signature module

- Modify: `apps/api/.env.example`
- Modify: `apps/api/src/app.module.ts`
- Create: `apps/api/src/modules/wechat-share/dto/jssdk-signature-query.dto.ts`
- Create: `apps/api/src/modules/wechat-share/wechat-share.controller.ts`
- Create: `apps/api/src/modules/wechat-share/wechat-share.controller.spec.ts`
- Create: `apps/api/src/modules/wechat-share/wechat-share.module.ts`
- Create: `apps/api/src/modules/wechat-share/wechat-share.service.ts`
- Create: `apps/api/src/modules/wechat-share/wechat-share.service.spec.ts`

### Web: route-based share metadata and SDK orchestration

- Create: `apps/web/src/content/wechat-share.js`
- Create: `apps/web/src/utils/wechatShare.js`
- Create: `apps/web/src/utils/wechatShare.test.js`
- Modify: `apps/web/src/App.vue`
- Modify: `apps/web/src/App.test.js`

### Verification

- Test: `pnpm --filter @gaoge/app-api test -- src/modules/wechat-share/wechat-share.service.spec.ts src/modules/wechat-share/wechat-share.controller.spec.ts`
- Test: `pnpm --filter @gaoge/app-web test -- src/utils/wechatShare.test.js src/App.test.js`
- Test: `pnpm --filter @gaoge/app-api typecheck`
- Test: `pnpm --filter @gaoge/app-web typecheck`

## Task 1: Add the official-account JSSDK signature module in `apps/api`

**Files:**

- Modify: `apps/api/.env.example`
- Modify: `apps/api/src/app.module.ts`
- Create: `apps/api/src/modules/wechat-share/dto/jssdk-signature-query.dto.ts`
- Create: `apps/api/src/modules/wechat-share/wechat-share.controller.ts`
- Create: `apps/api/src/modules/wechat-share/wechat-share.controller.spec.ts`
- Create: `apps/api/src/modules/wechat-share/wechat-share.module.ts`
- Create: `apps/api/src/modules/wechat-share/wechat-share.service.ts`
- Create: `apps/api/src/modules/wechat-share/wechat-share.service.spec.ts`
- Test: `pnpm --filter @gaoge/app-api test -- src/modules/wechat-share/wechat-share.service.spec.ts src/modules/wechat-share/wechat-share.controller.spec.ts`

- [ ] **Step 1: Write the failing service tests for config validation, URL normalization, caching, and upstream failures**

Create `apps/api/src/modules/wechat-share/wechat-share.service.spec.ts`:

```ts
import { BadGatewayException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { WechatShareService } from './wechat-share.service'

describe('WechatShareService', () => {
  const createConfigService = (values: Record<string, string | undefined>) =>
    ({
      get: jest.fn((key: string) => values[key]),
    }) as unknown as ConfigService

  const mockFetchResponse = (payload: Record<string, any>) =>
    ({
      ok: true,
      json: jest.fn().mockResolvedValue(payload),
    }) as any

  beforeEach(() => {
    jest.restoreAllMocks()
  })

  it('throws when official account config is missing', () => {
    expect(() => new WechatShareService(createConfigService({}))).toThrow(
      '微信公众号配置缺失，请检查 WECHAT_OFFICIAL_ACCOUNT_APPID 和 WECHAT_OFFICIAL_ACCOUNT_APPSECRET',
    )
  })

  it('strips hash before requesting ticket-based signature', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(
        mockFetchResponse({
          access_token: 'token-1',
          expires_in: 7200,
        }),
      )
      .mockResolvedValueOnce(
        mockFetchResponse({
          ticket: 'ticket-1',
          expires_in: 7200,
        }),
      )

    const service = new WechatShareService(
      createConfigService({
        WECHAT_OFFICIAL_ACCOUNT_APPID: 'wx-official',
        WECHAT_OFFICIAL_ACCOUNT_APPSECRET: 'secret',
      }),
    )

    const result = await service.getJssdkSignature(
      'https://gaoge.cc/teams/football?tab=rank#section',
    )

    expect(result.appId).toBe('wx-official')
    expect(result.signature).toHaveLength(40)
    expect(result.timestamp).toBeGreaterThan(0)
    expect(result.nonceStr).toHaveLength(16)
  })

  it('reuses cached access token and ticket inside one process', async () => {
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(
        mockFetchResponse({
          access_token: 'token-1',
          expires_in: 7200,
        }),
      )
      .mockResolvedValueOnce(
        mockFetchResponse({
          ticket: 'ticket-1',
          expires_in: 7200,
        }),
      )

    const service = new WechatShareService(
      createConfigService({
        WECHAT_OFFICIAL_ACCOUNT_APPID: 'wx-official',
        WECHAT_OFFICIAL_ACCOUNT_APPSECRET: 'secret',
      }),
    )

    await service.getJssdkSignature('https://gaoge.cc/')
    await service.getJssdkSignature('https://gaoge.cc/teams/football')

    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })

  it('throws a BadGatewayException when access token fetch fails', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce(
      mockFetchResponse({
        errcode: 40013,
        errmsg: 'invalid appid',
      }),
    )

    const service = new WechatShareService(
      createConfigService({
        WECHAT_OFFICIAL_ACCOUNT_APPID: 'wx-official',
        WECHAT_OFFICIAL_ACCOUNT_APPSECRET: 'secret',
      }),
    )

    await expect(service.getJssdkSignature('https://gaoge.cc/')).rejects.toThrow(
      new BadGatewayException('获取微信公众号 access_token 失败'),
    )
  })
})
```

- [ ] **Step 2: Write the failing controller tests for route metadata and delegation**

Create `apps/api/src/modules/wechat-share/wechat-share.controller.spec.ts`:

```ts
import { PATH_METADATA } from '@nestjs/common/constants'

import { WechatShareController } from './wechat-share.controller'

describe('WechatShareController', () => {
  it('uses the official account controller prefix', () => {
    expect(Reflect.getMetadata(PATH_METADATA, WechatShareController)).toBe(
      'wechat/official-account',
    )
  })

  it('maps getJssdkSignature to /wechat/official-account/jssdk-signature', () => {
    expect(
      Reflect.getMetadata(PATH_METADATA, WechatShareController.prototype.getJssdkSignature),
    ).toBe('jssdk-signature')
  })

  it('delegates the query url to the service', async () => {
    const service = {
      getJssdkSignature: jest.fn().mockResolvedValue({
        appId: 'wx-official',
        timestamp: 1716530000,
        nonceStr: 'nonce-string',
        signature: 'signature-value',
      }),
    }
    const controller = new WechatShareController(service as any)

    await expect(
      controller.getJssdkSignature({
        url: 'https://gaoge.cc/teams/football',
      }),
    ).resolves.toEqual({
      appId: 'wx-official',
      timestamp: 1716530000,
      nonceStr: 'nonce-string',
      signature: 'signature-value',
    })

    expect(service.getJssdkSignature).toHaveBeenCalledWith('https://gaoge.cc/teams/football')
  })
})
```

- [ ] **Step 3: Run the focused API tests to verify the module does not exist yet**

Run:

```bash
pnpm --filter @gaoge/app-api test -- src/modules/wechat-share/wechat-share.service.spec.ts src/modules/wechat-share/wechat-share.controller.spec.ts
```

Expected: FAIL because the controller and service files are not present yet.

- [ ] **Step 4: Add the DTO, controller, module registration, and service implementation**

Create `apps/api/src/modules/wechat-share/dto/jssdk-signature-query.dto.ts`:

```ts
import { IsNotEmpty, IsString, IsUrl } from 'class-validator'

export class JssdkSignatureQueryDto {
  @IsString()
  @IsNotEmpty()
  @IsUrl({
    require_tld: false,
  })
  url!: string
}
```

Create `apps/api/src/modules/wechat-share/wechat-share.controller.ts`:

```ts
import { Controller, Get, Query } from '@nestjs/common'

import { JssdkSignatureQueryDto } from './dto/jssdk-signature-query.dto'
import { WechatShareService } from './wechat-share.service'

@Controller('wechat/official-account')
export class WechatShareController {
  constructor(private readonly wechatOfficialAccountService: WechatShareService) {}

  @Get('jssdk-signature')
  getJssdkSignature(@Query() query: JssdkSignatureQueryDto) {
    return this.wechatOfficialAccountService.getJssdkSignature(query.url)
  }
}
```

Create `apps/api/src/modules/wechat-share/wechat-share.module.ts`:

```ts
import { Module } from '@nestjs/common'

import { WechatShareController } from './wechat-share.controller'
import { WechatShareService } from './wechat-share.service'

@Module({
  controllers: [WechatShareController],
  providers: [WechatShareService],
})
export class WechatShareModule {}
```

Create `apps/api/src/modules/wechat-share/wechat-share.service.ts`:

```ts
import * as crypto from 'node:crypto'
import { BadGatewayException, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

type CacheEntry = {
  value: string
  expiresAt: number
}

@Injectable()
export class WechatShareService {
  private readonly logger = new Logger(WechatShareService.name)
  private readonly appId: string
  private readonly appSecret: string
  private readonly baseUrl = 'https://api.weixin.qq.com'
  private accessTokenCache: CacheEntry | null = null
  private jsapiTicketCache: CacheEntry | null = null

  constructor(private readonly configService: ConfigService) {
    this.appId = this.configService.get<string>('WECHAT_OFFICIAL_ACCOUNT_APPID') || ''
    this.appSecret = this.configService.get<string>('WECHAT_OFFICIAL_ACCOUNT_APPSECRET') || ''

    if (!this.appId || !this.appSecret) {
      throw new Error(
        '微信公众号配置缺失，请检查 WECHAT_OFFICIAL_ACCOUNT_APPID 和 WECHAT_OFFICIAL_ACCOUNT_APPSECRET',
      )
    }
  }

  async getJssdkSignature(rawUrl: string) {
    const url = this.normalizeUrl(rawUrl)
    const [ticket, nonceStr, timestamp] = await Promise.all([
      this.getJsapiTicket(),
      Promise.resolve(crypto.randomBytes(8).toString('hex')),
      Promise.resolve(Math.floor(Date.now() / 1000)),
    ])

    const signature = crypto
      .createHash('sha1')
      .update(`jsapi_ticket=${ticket}&noncestr=${nonceStr}&timestamp=${timestamp}&url=${url}`)
      .digest('hex')

    return {
      appId: this.appId,
      timestamp,
      nonceStr,
      signature,
    }
  }

  private normalizeUrl(rawUrl: string) {
    const parsed = new URL(rawUrl)
    parsed.hash = ''
    return parsed.toString()
  }

  private async getJsapiTicket() {
    if (this.jsapiTicketCache && this.jsapiTicketCache.expiresAt > Date.now()) {
      return this.jsapiTicketCache.value
    }

    const accessToken = await this.getAccessToken()
    const url = new URL(`${this.baseUrl}/cgi-bin/ticket/getticket`)
    url.searchParams.set('access_token', accessToken)
    url.searchParams.set('type', 'jsapi')

    const response = await fetch(url.toString())
    const payload = await response.json()

    if (!response.ok || payload.errcode) {
      this.logger.error('获取微信公众号 jsapi_ticket 失败', payload)
      throw new BadGatewayException('获取微信公众号 jsapi_ticket 失败')
    }

    this.jsapiTicketCache = {
      value: payload.ticket,
      expiresAt: Date.now() + Math.max((payload.expires_in - 300) * 1000, 60_000),
    }

    return payload.ticket
  }

  private async getAccessToken() {
    if (this.accessTokenCache && this.accessTokenCache.expiresAt > Date.now()) {
      return this.accessTokenCache.value
    }

    const url = new URL(`${this.baseUrl}/cgi-bin/token`)
    url.searchParams.set('grant_type', 'client_credential')
    url.searchParams.set('appid', this.appId)
    url.searchParams.set('secret', this.appSecret)

    const response = await fetch(url.toString())
    const payload = await response.json()

    if (!response.ok || payload.errcode) {
      this.logger.error('获取微信公众号 access_token 失败', payload)
      throw new BadGatewayException('获取微信公众号 access_token 失败')
    }

    this.accessTokenCache = {
      value: payload.access_token,
      expiresAt: Date.now() + Math.max((payload.expires_in - 300) * 1000, 60_000),
    }

    return payload.access_token
  }
}
```

Update `apps/api/src/app.module.ts`:

```ts
import { WechatShareModule } from './modules/wechat-share/wechat-share.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule,
    WechatModule,
    WechatShareModule,
    HealthModule,
    BasketballModule,
    FootballModule,
    AuthModule,
    BannerModule,
    MiniappModule,
    SystemModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

Update `apps/api/.env.example`:

```env
# 微信小程序配置
WECHAT_APPID=
WECHAT_APPSECRET=

# 微信公众号网页分享配置
WECHAT_OFFICIAL_ACCOUNT_APPID=
WECHAT_OFFICIAL_ACCOUNT_APPSECRET=
```

- [ ] **Step 5: Re-run the focused API tests**

Run:

```bash
pnpm --filter @gaoge/app-api test -- src/modules/wechat-share/wechat-share.service.spec.ts src/modules/wechat-share/wechat-share.controller.spec.ts
```

Expected: PASS with 7 passing tests.

- [ ] **Step 6: Commit the API signature module**

```bash
git add apps/api/.env.example apps/api/src/app.module.ts apps/api/src/modules/wechat-share
git commit -m "feat: add wechat official account signature api"
```

## Task 2: Add route-based share metadata and SDK orchestration in `apps/web`

**Files:**

- Create: `apps/web/src/content/wechat-share.js`
- Create: `apps/web/src/utils/wechatShare.js`
- Create: `apps/web/src/utils/wechatShare.test.js`
- Test: `pnpm --filter @gaoge/app-web test -- src/utils/wechatShare.test.js`

- [ ] **Step 1: Write the failing web share utility tests**

Create `apps/web/src/utils/wechatShare.test.js`:

```js
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { syncWechatShare } from './wechatShare'
import * as api from './api'

vi.mock('./api', () => ({
  getJson: vi.fn(),
}))

const mockWx = {
  config: vi.fn(),
  ready: vi.fn((callback) => callback()),
  updateAppMessageShareData: vi.fn(),
  updateTimelineShareData: vi.fn(),
}

describe('syncWechatShare', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      navigator: {
        userAgent: 'Mozilla/5.0 MicroMessenger',
      },
      location: {
        href: 'https://gaoge.cc/teams/football#ranking',
      },
      wx: mockWx,
      document: {
        querySelector: vi.fn().mockReturnValue(null),
        createElement: vi.fn(),
        head: { appendChild: vi.fn() },
      },
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  it('skips initialization outside the wechat browser', async () => {
    window.navigator.userAgent = 'Mozilla/5.0 Safari'

    await syncWechatShare({
      path: '/',
      fullPath: '/',
    })

    expect(api.getJson).not.toHaveBeenCalled()
    expect(mockWx.config).not.toHaveBeenCalled()
  })

  it('requests a signature and sets route-specific share data for the teams page', async () => {
    api.getJson.mockResolvedValue({
      appId: 'wx-official',
      timestamp: 1716530000,
      nonceStr: 'nonce-value',
      signature: 'signature-value',
    })

    await syncWechatShare({
      path: '/teams/football',
      fullPath: '/teams/football',
    })

    expect(api.getJson).toHaveBeenCalledWith('/wechat/official-account/jssdk-signature', {
      url: 'https://gaoge.cc/teams/football',
    })
    expect(mockWx.config).toHaveBeenCalledWith(
      expect.objectContaining({
        appId: 'wx-official',
        timestamp: 1716530000,
        nonceStr: 'nonce-value',
        signature: 'signature-value',
        jsApiList: ['updateAppMessageShareData', 'updateTimelineShareData'],
      }),
    )
    expect(mockWx.updateAppMessageShareData).toHaveBeenCalledWith(
      expect.objectContaining({
        link: 'https://gaoge.cc/teams/football',
      }),
    )
    expect(mockWx.updateTimelineShareData).toHaveBeenCalledWith(
      expect.objectContaining({
        link: 'https://gaoge.cc/teams/football',
      }),
    )
  })

  it('uses the asset-page metadata for /teams/football/assets', async () => {
    api.getJson.mockResolvedValue({
      appId: 'wx-official',
      timestamp: 1716530000,
      nonceStr: 'nonce-value',
      signature: 'signature-value',
    })

    await syncWechatShare({
      path: '/teams/football/assets',
      fullPath: '/teams/football/assets',
    })

    expect(mockWx.updateAppMessageShareData).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining('资产'),
      }),
    )
  })
})
```

- [ ] **Step 2: Run the focused web share test to verify the utility does not exist yet**

Run:

```bash
pnpm --filter @gaoge/app-web test -- src/utils/wechatShare.test.js
```

Expected: FAIL because `syncWechatShare` and the share metadata file are not present yet.

- [ ] **Step 3: Add the route metadata file and SDK utility**

Create `apps/web/src/content/wechat-share.js`:

```js
const shareImageUrl = 'https://gaoge.cc/images/share/gaoge-default-share.png'

export const wechatShareConfigs = {
  home: {
    title: '高歌体育',
    desc: '高歌不止于胜负，关于球队、故事与热爱都在这里。',
    imgUrl: shareImageUrl,
  },
  teams: {
    title: '高歌球队',
    desc: '查看高歌球队阵容、积分走势与最新动态。',
    imgUrl: shareImageUrl,
  },
  footballAssets: {
    title: '高歌FC 球队资产',
    desc: '查看高歌FC公开收支总览与历史流水记录。',
    imgUrl: shareImageUrl,
  },
}

export function resolveWechatShareConfig(path) {
  if (path === '/teams/football/assets') {
    return wechatShareConfigs.footballAssets
  }

  if (path.startsWith('/teams')) {
    return wechatShareConfigs.teams
  }

  return wechatShareConfigs.home
}
```

Create `apps/web/src/utils/wechatShare.js`:

```js
import { resolveWechatShareConfig } from '@/content/wechat-share'

import { getJson } from './api'

const WECHAT_SDK_SRC = 'https://res.wx.qq.com/open/js/jweixin-1.6.0.js'

function isWechatBrowser() {
  return /MicroMessenger/i.test(window.navigator.userAgent || '')
}

function normalizeCurrentUrl() {
  const currentUrl = new URL(window.location.href)
  currentUrl.hash = ''
  return currentUrl.toString()
}

async function ensureWechatSdk() {
  if (window.wx) {
    return window.wx
  }

  const existingScript = document.querySelector(`script[src="${WECHAT_SDK_SRC}"]`)
  if (existingScript) {
    return new Promise((resolve, reject) => {
      existingScript.addEventListener('load', () => resolve(window.wx), { once: true })
      existingScript.addEventListener('error', reject, { once: true })
    })
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = WECHAT_SDK_SRC
    script.async = true
    script.onload = () => resolve(window.wx)
    script.onerror = () => reject(new Error('微信 JS-SDK 加载失败'))
    document.head.appendChild(script)
  })
}

export async function syncWechatShare(route) {
  if (typeof window === 'undefined' || !isWechatBrowser()) {
    return
  }

  const wx = await ensureWechatSdk()
  const link = normalizeCurrentUrl()
  const shareConfig = resolveWechatShareConfig(route.path)
  const signature = await getJson('/wechat/official-account/jssdk-signature', {
    url: link,
  })

  wx.config({
    debug: false,
    appId: signature.appId,
    timestamp: signature.timestamp,
    nonceStr: signature.nonceStr,
    signature: signature.signature,
    jsApiList: ['updateAppMessageShareData', 'updateTimelineShareData'],
  })

  wx.ready(() => {
    wx.updateAppMessageShareData({
      ...shareConfig,
      link,
    })
    wx.updateTimelineShareData({
      title: shareConfig.title,
      imgUrl: shareConfig.imgUrl,
      link,
    })
  })
}
```

- [ ] **Step 4: Re-run the focused web share test**

Run:

```bash
pnpm --filter @gaoge/app-web test -- src/utils/wechatShare.test.js
```

Expected: PASS with 3 passing tests.

- [ ] **Step 5: Commit the web share utility layer**

```bash
git add apps/web/src/content/wechat-share.js apps/web/src/utils/wechatShare.js apps/web/src/utils/wechatShare.test.js
git commit -m "feat: add web wechat share utilities"
```

## Task 3: Wire the share utility into the app shell and verify SPA route updates

**Files:**

- Modify: `apps/web/src/App.vue`
- Modify: `apps/web/src/App.test.js`
- Test: `pnpm --filter @gaoge/app-web test -- src/App.test.js`

- [ ] **Step 1: Write the failing app-shell test for initial load and route change sync**

Update `apps/web/src/App.test.js`:

```js
import { mount, flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import App from './App.vue'
import HomePage from './views/HomePage.vue'
import TeamAssetPage from './views/TeamAssetPage.vue'
import TeamsPage from './views/TeamsPage.vue'

const shareApi = vi.hoisted(() => ({
  syncWechatShare: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/utils/wechatShare', () => shareApi)

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: HomePage },
      { path: '/teams/football/assets', name: 'team-assets', component: TeamAssetPage },
      { path: '/teams/:team?', name: 'teams', component: TeamsPage },
    ],
  })
}

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('syncs wechat share on initial render and after route changes', async () => {
    const router = createTestRouter()
    await router.push('/')
    await router.isReady()

    mount(App, {
      global: {
        plugins: [router],
        stubs: {
          Icon: { template: '<span />' },
        },
      },
    })

    await flushPromises()
    expect(shareApi.syncWechatShare).toHaveBeenCalledWith(expect.objectContaining({ path: '/' }))

    await router.push('/teams/football/assets')
    await flushPromises()

    expect(shareApi.syncWechatShare).toHaveBeenLastCalledWith(
      expect.objectContaining({ path: '/teams/football/assets' }),
    )
  })
})
```

- [ ] **Step 2: Run the app test to verify the shell does not call the share utility yet**

Run:

```bash
pnpm --filter @gaoge/app-web test -- src/App.test.js
```

Expected: FAIL because `App.vue` does not yet import or call `syncWechatShare`.

- [ ] **Step 3: Add route watching in the app shell**

Update `apps/web/src/App.vue`:

```vue
<script setup>
import { nextTick, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'

import { syncWechatShare } from '@/utils/wechatShare'

const route = useRoute()

watch(
  () => route.fullPath,
  async () => {
    await nextTick()
    await syncWechatShare(route)
  },
  {
    immediate: true,
  },
)
</script>
```

Keep the existing template and transition styles unchanged.

- [ ] **Step 4: Re-run the app test**

Run:

```bash
pnpm --filter @gaoge/app-web test -- src/App.test.js
```

Expected: PASS with 1 passing test.

- [ ] **Step 5: Run full targeted verification across API and web**

Run:

```bash
pnpm --filter @gaoge/app-api test -- src/modules/wechat-share/wechat-share.service.spec.ts src/modules/wechat-share/wechat-share.controller.spec.ts
pnpm --filter @gaoge/app-web test -- src/utils/wechatShare.test.js src/App.test.js
pnpm --filter @gaoge/app-api typecheck
pnpm --filter @gaoge/app-web typecheck
```

Expected:

- API tests PASS
- Web tests PASS
- API typecheck PASS
- Web typecheck PASS

- [ ] **Step 6: Commit the shell wiring and verification**

```bash
git add apps/web/src/App.vue apps/web/src/App.test.js
git commit -m "feat: wire web wechat share into app shell"
```
