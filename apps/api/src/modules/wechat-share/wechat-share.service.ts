import * as crypto from 'node:crypto'
import { BadGatewayException, BadRequestException, Injectable, Logger } from '@nestjs/common'

import type {
  UpdateWechatShareAdminConfigPayload,
  WechatShareAdminConfig,
  WechatSharePublicConfig,
} from '@gaoge/shared-types'

import { PrismaService } from '@/common/prisma/prisma.service'

type CacheEntry = {
  key: string
  value: string
  expiresAt: number
}

type StoredWechatShareConfig = {
  appId: string
  appSecret: string
  defaultImageUrl: string
  homeTitle: string
  homeDesc: string
  homeImageUrl: string
  teamsTitle: string
  teamsDesc: string
  teamsImageUrl: string
  assetsTitle: string
  assetsDesc: string
  assetsImageUrl: string
}

type WechatShareConfigDelegate = {
  findFirst: (args: { where: { id: number } }) => Promise<StoredWechatShareConfig | null>
  upsert: (args: {
    where: { id: number }
    create: StoredWechatShareConfig & { id: number }
    update: StoredWechatShareConfig
  }) => Promise<StoredWechatShareConfig>
}

@Injectable()
export class WechatShareService {
  private readonly logger = new Logger(WechatShareService.name)
  private readonly baseUrl = 'https://api.weixin.qq.com'
  private accessTokenCache: CacheEntry | null = null
  private jsapiTicketCache: CacheEntry | null = null

  constructor(private readonly prisma: PrismaService) {}

  private get configStore(): WechatShareConfigDelegate {
    return (this.prisma as unknown as { wechatShareConfig: WechatShareConfigDelegate })
      .wechatShareConfig
  }

  async getAdminConfig(): Promise<WechatShareAdminConfig> {
    const config = await this.configStore.findFirst({
      where: { id: 1 },
    })

    return this.serializeAdminConfig(config)
  }

  async updateAdminConfig(
    payload: UpdateWechatShareAdminConfigPayload,
  ): Promise<WechatShareAdminConfig> {
    const currentConfig = await this.configStore.findFirst({
      where: { id: 1 },
    })

    const normalizedPayload = this.normalizeAdminPayload(payload, currentConfig)
    const savedConfig = await this.configStore.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        ...normalizedPayload,
      },
      update: normalizedPayload,
    })

    if (
      currentConfig?.appId !== savedConfig.appId ||
      currentConfig?.appSecret !== savedConfig.appSecret
    ) {
      this.clearWechatCredentialCache()
    }

    return this.serializeAdminConfig(savedConfig)
  }

  async getPublicConfig(path: string): Promise<WechatSharePublicConfig> {
    const config = await this.getRequiredConfig()

    const routeKey = this.resolveRouteKey(path)
    const routeConfig = this.resolveRouteConfig(routeKey, config)
    const imgUrl = routeConfig.imgUrl || config.defaultImageUrl

    if (!routeConfig.title || !routeConfig.desc || !imgUrl) {
      throw new BadRequestException('微信分享页面配置不完整')
    }

    return {
      title: routeConfig.title,
      desc: routeConfig.desc,
      imgUrl,
    }
  }

  async getJssdkSignature(rawUrl: string) {
    const config = await this.getRequiredConfig()
    const appId = config.appId.trim()
    const appSecret = config.appSecret.trim()

    if (!appId || !appSecret) {
      throw new BadRequestException('微信公众号配置尚未完成')
    }

    const url = this.normalizeUrl(rawUrl)
    const [ticket, nonceStr, timestamp] = await Promise.all([
      this.getJsapiTicket(appId, appSecret),
      Promise.resolve(crypto.randomBytes(8).toString('hex')),
      Promise.resolve(Math.floor(Date.now() / 1000)),
    ])

    const signature = crypto
      .createHash('sha1')
      .update(`jsapi_ticket=${ticket}&noncestr=${nonceStr}&timestamp=${timestamp}&url=${url}`)
      .digest('hex')

    return {
      appId,
      timestamp,
      nonceStr,
      signature,
    }
  }

  private serializeAdminConfig(config: StoredWechatShareConfig | null): WechatShareAdminConfig {
    return {
      appId: config?.appId ?? '',
      hasAppSecret: Boolean(config?.appSecret),
      defaultImageUrl: config?.defaultImageUrl ?? '',
      homeTitle: config?.homeTitle ?? '',
      homeDesc: config?.homeDesc ?? '',
      homeImageUrl: config?.homeImageUrl ?? '',
      teamsTitle: config?.teamsTitle ?? '',
      teamsDesc: config?.teamsDesc ?? '',
      teamsImageUrl: config?.teamsImageUrl ?? '',
      assetsTitle: config?.assetsTitle ?? '',
      assetsDesc: config?.assetsDesc ?? '',
      assetsImageUrl: config?.assetsImageUrl ?? '',
    }
  }

  private normalizeAdminPayload(
    payload: UpdateWechatShareAdminConfigPayload,
    currentConfig: StoredWechatShareConfig | null,
  ) {
    const normalizeText = (value: string | undefined) => (value ?? '').trim()

    const nextAppSecret = normalizeText(payload.appSecret)

    return {
      appId: normalizeText(payload.appId),
      appSecret: nextAppSecret || currentConfig?.appSecret || '',
      defaultImageUrl: normalizeText(payload.defaultImageUrl),
      homeTitle: normalizeText(payload.homeTitle),
      homeDesc: normalizeText(payload.homeDesc),
      homeImageUrl: normalizeText(payload.homeImageUrl),
      teamsTitle: normalizeText(payload.teamsTitle),
      teamsDesc: normalizeText(payload.teamsDesc),
      teamsImageUrl: normalizeText(payload.teamsImageUrl),
      assetsTitle: normalizeText(payload.assetsTitle),
      assetsDesc: normalizeText(payload.assetsDesc),
      assetsImageUrl: normalizeText(payload.assetsImageUrl),
    }
  }

  private async getRequiredConfig() {
    const config = await this.configStore.findFirst({
      where: { id: 1 },
    })

    if (!config) {
      throw new BadRequestException('微信分享配置尚未完成')
    }

    return config
  }

  private resolveRouteKey(path: string) {
    if (path === '/teams/football/assets') {
      return 'assets'
    }

    if (path.startsWith('/teams')) {
      return 'teams'
    }

    return 'home'
  }

  private resolveRouteConfig(
    routeKey: 'home' | 'teams' | 'assets',
    config: StoredWechatShareConfig,
  ) {
    if (routeKey === 'assets') {
      return {
        title: config.assetsTitle,
        desc: config.assetsDesc,
        imgUrl: config.assetsImageUrl,
      }
    }

    if (routeKey === 'teams') {
      return {
        title: config.teamsTitle,
        desc: config.teamsDesc,
        imgUrl: config.teamsImageUrl,
      }
    }

    return {
      title: config.homeTitle,
      desc: config.homeDesc,
      imgUrl: config.homeImageUrl,
    }
  }

  private normalizeUrl(rawUrl: string) {
    const parsedUrl = new URL(rawUrl)
    parsedUrl.hash = ''
    return parsedUrl.toString()
  }

  private clearWechatCredentialCache() {
    this.accessTokenCache = null
    this.jsapiTicketCache = null
  }

  private async getJsapiTicket(appId: string, appSecret: string) {
    const cacheKey = `${appId}:${appSecret}`

    if (this.jsapiTicketCache?.key === cacheKey && this.jsapiTicketCache.expiresAt > Date.now()) {
      return this.jsapiTicketCache.value
    }

    const accessToken = await this.getAccessToken(appId, appSecret)
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
      key: cacheKey,
      value: payload.ticket,
      expiresAt: Date.now() + Math.max((payload.expires_in - 300) * 1000, 60_000),
    }

    return payload.ticket
  }

  private async getAccessToken(appId: string, appSecret: string) {
    const cacheKey = `${appId}:${appSecret}`

    if (this.accessTokenCache?.key === cacheKey && this.accessTokenCache.expiresAt > Date.now()) {
      return this.accessTokenCache.value
    }

    const url = new URL(`${this.baseUrl}/cgi-bin/token`)
    url.searchParams.set('grant_type', 'client_credential')
    url.searchParams.set('appid', appId)
    url.searchParams.set('secret', appSecret)

    const response = await fetch(url.toString())
    const payload = await response.json()

    if (!response.ok || payload.errcode) {
      this.logger.error('获取微信公众号 access_token 失败', payload)
      throw new BadGatewayException('获取微信公众号 access_token 失败')
    }

    this.accessTokenCache = {
      key: cacheKey,
      value: payload.access_token,
      expiresAt: Date.now() + Math.max((payload.expires_in - 300) * 1000, 60_000),
    }

    return payload.access_token
  }
}
