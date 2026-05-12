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

    expect(prisma.player.findFirst).toHaveBeenCalledWith({
      where: { userId: 1 },
      select: {
        id: true,
        playerNumber: true,
        nickname: true,
        avatarUrl: true,
        subTeam: true,
        status: true,
      },
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
