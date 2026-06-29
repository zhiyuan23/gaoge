import { BadRequestException } from '@nestjs/common'

import { WechatShareService } from './wechat-share.service'

describe('WechatShareService', () => {
  const createPrisma = (config?: Record<string, any>) => ({
    wechatShareConfig: {
      findFirst: jest.fn().mockResolvedValue(config ?? null),
      upsert: jest.fn().mockImplementation(async ({ create, update }: any) => ({
        id: 1,
        ...create,
        ...update,
      })),
    },
  })

  const mockFetchResponse = (payload: Record<string, any>) =>
    ({
      ok: true,
      json: jest.fn().mockResolvedValue(payload),
    }) as any

  const createStoredConfig = (overrides: Record<string, any> = {}) => ({
    id: 1,
    appId: 'wx-db-appid',
    appSecret: 'db-secret',
    defaultImageUrl: 'https://cdn.gaoge.cc/default.png',
    homeTitle: '首页标题',
    homeDesc: '首页简介',
    homeImageUrl: '',
    teamsTitle: '球队标题',
    teamsDesc: '球队简介',
    teamsImageUrl: 'https://cdn.gaoge.cc/teams.png',
    assetsTitle: '资产标题',
    assetsDesc: '资产简介',
    assetsImageUrl: '',
    createdAt: new Date('2026-05-25T00:00:00.000Z'),
    updatedAt: new Date('2026-05-25T00:00:00.000Z'),
    ...overrides,
  })

  beforeEach(() => {
    jest.restoreAllMocks()
  })

  it('returns admin config without exposing appSecret', async () => {
    const service = new WechatShareService(createPrisma(createStoredConfig()) as any)

    await expect(service.getAdminConfig()).resolves.toEqual({
      appId: 'wx-db-appid',
      hasAppSecret: true,
      defaultImageUrl: 'https://cdn.gaoge.cc/default.png',
      homeTitle: '首页标题',
      homeDesc: '首页简介',
      homeImageUrl: '',
      teamsTitle: '球队标题',
      teamsDesc: '球队简介',
      teamsImageUrl: 'https://cdn.gaoge.cc/teams.png',
      assetsTitle: '资产标题',
      assetsDesc: '资产简介',
      assetsImageUrl: '',
    })
  })

  it('creates the first config row and keeps the existing appSecret when a later update leaves it blank', async () => {
    const prisma = createPrisma()
    const service = new WechatShareService(prisma as any)

    await service.updateAdminConfig({
      appId: 'wx-db-appid',
      appSecret: 'db-secret',
      defaultImageUrl: 'https://cdn.gaoge.cc/default.png',
      homeTitle: '首页标题',
      homeDesc: '首页简介',
      homeImageUrl: '',
      teamsTitle: '球队标题',
      teamsDesc: '球队简介',
      teamsImageUrl: '',
      assetsTitle: '资产标题',
      assetsDesc: '资产简介',
      assetsImageUrl: '',
    } as any)

    prisma.wechatShareConfig.findFirst.mockResolvedValue(createStoredConfig())

    await service.updateAdminConfig({
      appId: 'wx-db-appid',
      appSecret: '',
      defaultImageUrl: 'https://cdn.gaoge.cc/default.png',
      homeTitle: '首页标题',
      homeDesc: '首页简介',
      homeImageUrl: '',
      teamsTitle: '球队标题',
      teamsDesc: '球队简介',
      teamsImageUrl: '',
      assetsTitle: '资产标题',
      assetsDesc: '资产简介',
      assetsImageUrl: '',
    } as any)

    expect(prisma.wechatShareConfig.upsert).toHaveBeenLastCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          appId: 'wx-db-appid',
          homeTitle: '首页标题',
        }),
      }),
    )
    expect(prisma.wechatShareConfig.upsert).toHaveBeenLastCalledWith(
      expect.not.objectContaining({
        update: expect.objectContaining({
          appSecret: '',
        }),
      }),
    )
  })

  it('maps public config by path and falls back to the default image', async () => {
    const service = new WechatShareService(prismaWithConfig() as any)

    await expect(service.getPublicConfig('/teams/football/assets')).resolves.toEqual({
      title: '资产标题',
      desc: '资产简介',
      imgUrl: 'https://cdn.gaoge.cc/default.png',
    })

    await expect(service.getPublicConfig('/teams/football')).resolves.toEqual({
      title: '球队标题',
      desc: '球队简介',
      imgUrl: 'https://cdn.gaoge.cc/teams.png',
    })

    await expect(service.getPublicConfig('/')).resolves.toEqual({
      title: '首页标题',
      desc: '首页简介',
      imgUrl: 'https://cdn.gaoge.cc/default.png',
    })
  })

  it('throws a clear error when public config is requested before setup completes', async () => {
    const service = new WechatShareService(createPrisma() as any)

    await expect(service.getPublicConfig('/')).rejects.toThrow(
      new BadRequestException('微信分享配置尚未完成'),
    )
  })

  it('uses database appId and appSecret when generating a signature', async () => {
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
    jest.spyOn(Date, 'now').mockReturnValue(1716530000000)

    const service = new WechatShareService(prismaWithConfig() as any)

    await expect(
      service.getJssdkSignature('https://gaoge.cc/teams/football?tab=rank#section'),
    ).resolves.toMatchObject({
      appId: 'wx-db-appid',
      timestamp: 1716530000,
    })
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

    const service = new WechatShareService(prismaWithConfig() as any)

    await service.getJssdkSignature('https://gaoge.cc/')
    await service.getJssdkSignature('https://gaoge.cc/teams/football')

    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })

  it('throws a clear error when jssdk credentials are not configured in the database', async () => {
    const service = new WechatShareService(
      createPrisma(
        createStoredConfig({
          appId: '',
          appSecret: '',
        }),
      ) as any,
    )

    await expect(service.getJssdkSignature('https://gaoge.cc/')).rejects.toThrow(
      new BadRequestException('微信公众号配置尚未完成'),
    )
  })

  function prismaWithConfig() {
    return createPrisma(createStoredConfig())
  }
})
