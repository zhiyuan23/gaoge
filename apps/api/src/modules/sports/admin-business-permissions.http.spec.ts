import type { CanActivate, ExecutionContext, INestApplication } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import type { App } from 'supertest/types'

import { PermissionsGuard } from '@/common/auth/permissions.guard'
import { RolesGuard } from '@/common/auth/roles.guard'
import { HttpExceptionFilter } from '@/common/http/http-exception.filter'
import { ResponseInterceptor } from '@/common/http/response.interceptor'
import { JwtAuthGuard } from '@/modules/auth/jwt-auth.guard'
import { WechatShareController } from '@/modules/wechat-share/wechat-share.controller'
import { WechatShareService } from '@/modules/wechat-share/wechat-share.service'

import { BannerController } from './content/banner/banner.controller'
import { BannerService } from './content/banner/banner.service'
import { RumorPostController } from './content/rumor-post/rumor-post.controller'
import { RumorPostService } from './content/rumor-post/rumor-post.service'
import { AssetRecordController } from './football/asset-record/asset-record.controller'
import { AssetRecordService } from './football/asset-record/asset-record.service'
import { FundController } from './football/fund/fund.controller'
import { FundService } from './football/fund/fund.service'
import { MatchRoundController } from './football/match-round/match-round.controller'
import { MatchRoundService } from './football/match-round/match-round.service'
import { PlayerController } from './football/player/player.controller'
import { PlayerService } from './football/player/player.service'
import { TeamController } from './football/team/team.controller'
import { TeamService } from './football/team/team.service'

const restrictedPermission = 'football.player.view'

class TestAdminJwtGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>
      user?: { id: number; role: string; permissions: string[] }
    }>()
    const header = request.headers['x-test-permissions']
    const value = Array.isArray(header) ? header[0] : header
    request.user = {
      id: 42,
      role: 'admin',
      permissions: value?.split(',').filter(Boolean) ?? [],
    }
    return true
  }
}

describe('Admin business HTTP permission contract', () => {
  let app: INestApplication<App>

  beforeAll(async () => {
    const serviceProviders = [
      [PlayerService, { create: jest.fn().mockReturnValue({ id: 1 }) }],
      [TeamService, { create: jest.fn().mockReturnValue({ id: 1 }) }],
      [MatchRoundService, { create: jest.fn().mockReturnValue({ id: 1 }) }],
      [AssetRecordService, { create: jest.fn().mockReturnValue({ id: 1 }) }],
      [FundService, { create: jest.fn().mockReturnValue({ id: 1 }) }],
      [
        BannerService,
        {
          findAll: jest.fn().mockReturnValue([]),
          create: jest.fn().mockReturnValue({ id: 1 }),
        },
      ],
      [RumorPostService, { create: jest.fn().mockReturnValue({ id: 1 }) }],
      [WechatShareService, { updateAdminConfig: jest.fn().mockReturnValue({}) }],
    ].map(([provide, useValue]) => ({ provide, useValue }))
    const moduleRef = await Test.createTestingModule({
      controllers: [
        PlayerController,
        TeamController,
        MatchRoundController,
        AssetRecordController,
        FundController,
        BannerController,
        RumorPostController,
        WechatShareController,
      ],
      providers: [Reflector, PermissionsGuard, RolesGuard, ...serviceProviders],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(TestAdminJwtGuard)
      .compile()

    app = moduleRef.createNestApplication()
    app.useGlobalInterceptors(new ResponseInterceptor())
    app.useGlobalFilters(new HttpExceptionFilter())
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  it.each([
    ['POST', '/football/players'],
    ['PATCH', '/football/players/1'],
    ['DELETE', '/football/players/1'],
    ['POST', '/football/teams'],
    ['POST', '/football/match-rounds'],
    ['POST', '/football/asset-records'],
    ['POST', '/football/fund'],
    ['POST', '/content/banners'],
    ['POST', '/content/rumor-posts'],
    ['PUT', '/wechat/share/admin-config'],
  ])('%s %s rejects a legacy admin lacking the exact permission', async (method, path) => {
    const response = await request(app.getHttpServer())
      [method.toLowerCase() as 'post'](path)
      .set('x-test-permissions', restrictedPermission)
      .send({})
      .expect(200)

    expect(response.body).toEqual({
      code: 403,
      data: null,
      errMsg: '暂无权限执行此操作',
    })
  })

  it('allows a write when the exact action permission is present', async () => {
    const response = await request(app.getHttpServer())
      .post('/football/players')
      .set('x-test-permissions', 'football.player.create')
      .send({})
      .expect(201)

    expect(response.body).toEqual({ code: 0, data: { id: 1 }, errMsg: '' })
  })

  it('allows a protected view when the exact view permission is present', async () => {
    const response = await request(app.getHttpServer())
      .get('/content/banners/list')
      .set('x-test-permissions', 'content.banner.view')
      .expect(200)

    expect(response.body).toEqual({ code: 0, data: [], errMsg: '' })
  })
})
