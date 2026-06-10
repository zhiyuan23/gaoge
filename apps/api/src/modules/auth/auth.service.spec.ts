import { UnauthorizedException } from '@nestjs/common'

import { hashPassword } from '@/common/auth/password.util'

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
      player: null,
    })

    expect(prisma.player.findFirst).toHaveBeenCalledWith({
      where: { userId: 1 },
      select: {
        id: true,
        playerNumber: true,
        nickname: true,
        avatarUrl: true,
        realName: true,
        subTeam: true,
        jerseyName: true,
        birthDate: true,
        isAdmin: true,
        position: true,
        jerseySize: true,
        status: true,
        remark: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  })

  it('returns player info when the miniapp user is already linked to a football player', async () => {
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
      avatarUrl: 'https://example.com/p18.png',
      realName: 'Zinedine Zidane',
      subTeam: 'real',
      jerseyName: 'ZIDANE',
      birthDate: new Date('1990-06-10T00:00:00.000Z'),
      isAdmin: true,
      position: 'midfielder',
      jerseySize: 'L',
      status: 'active',
      remark: 'captain',
      createdAt: new Date('2026-05-01T08:00:00.000Z'),
      updatedAt: new Date('2026-05-12T09:30:00.000Z'),
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
      player: {
        playerId: 18,
        playerNumber: 7,
        nickname: '齐达内',
        avatarUrl: 'https://example.com/p18.png',
        realName: 'Zinedine Zidane',
        subTeam: 'real',
        jerseyName: 'ZIDANE',
        birthDate: '1990-06-10T00:00:00.000Z',
        isAdmin: true,
        position: 'midfielder',
        jerseySize: 'L',
        status: 'active',
        remark: 'captain',
        createdAt: '2026-05-01T08:00:00.000Z',
        updatedAt: '2026-05-12T09:30:00.000Z',
      },
    })
  })
})

describe('AuthService admin RBAC', () => {
  const createService = () => {
    const prisma = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      player: {
        findFirst: jest.fn(),
      },
      refreshToken: {
        create: jest.fn(),
      },
      userRole: {
        findMany: jest.fn(),
      },
    }
    const wechatService = {
      getSessionByCode: jest.fn(),
      decryptPhoneInfo: jest.fn(),
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

  it('rejects admin login when the backend account has no active role', async () => {
    const { service, prisma } = createService()

    prisma.user.findFirst.mockResolvedValue({
      id: 1,
      account: 'admin',
      passwordHash: await hashPassword('Admin@123456'),
      role: 'admin',
      status: 'active',
      deletedAt: null,
    })
    prisma.userRole.findMany.mockResolvedValue([])

    await expect(
      service.adminLogin({
        account: 'admin',
        password: 'Admin@123456',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException)
  })

  it('aggregates permissions from multiple active roles and filters inactive entries', async () => {
    const { service, prisma } = createService()

    prisma.user.findUnique.mockResolvedValue({
      id: 3,
      account: 'ops',
      openid: null,
      nickname: 'Ops',
      avatarUrl: null,
      phone: null,
      role: 'admin',
      status: 'active',
      deletedAt: null,
      lastLoginAt: null,
    })
    prisma.userRole.findMany.mockResolvedValue([
      {
        role: {
          id: 11,
          code: 'super_admin',
          name: '超级管理员',
          status: 'active',
          rolePermissions: [
            {
              permission: {
                code: 'system.user.view',
                status: 'active',
              },
            },
            {
              permission: {
                code: 'system.role.view',
                status: 'inactive',
              },
            },
          ],
        },
      },
      {
        role: {
          id: 12,
          code: 'auditor',
          name: '审计员',
          status: 'active',
          rolePermissions: [
            {
              permission: {
                code: 'system.permission.view',
                status: 'active',
              },
            },
          ],
        },
      },
      {
        role: {
          id: 13,
          code: 'disabled',
          name: '停用角色',
          status: 'inactive',
          rolePermissions: [
            {
              permission: {
                code: 'system.menu.view',
                status: 'active',
              },
            },
          ],
        },
      },
    ])

    await expect(service.getPermission(3)).resolves.toEqual({
      permissions: expect.arrayContaining([
        'system.permission.view',
        'system.user.view',
        'system.wechat-share.view',
      ]),
      role: 'admin',
      roles: [
        {
          id: 11,
          code: 'super_admin',
          name: '超级管理员',
          status: 'active',
        },
        {
          id: 12,
          code: 'auditor',
          name: '审计员',
          status: 'active',
        },
      ],
    })
  })

  it('includes latest built-in permissions for super_admin even before rbac sync updates role bindings', async () => {
    const { service, prisma } = createService()

    prisma.user.findUnique.mockResolvedValue({
      id: 9,
      account: 'admin',
      openid: null,
      nickname: 'Admin',
      avatarUrl: null,
      phone: null,
      role: 'admin',
      status: 'active',
      deletedAt: null,
      lastLoginAt: null,
    })
    prisma.userRole.findMany.mockResolvedValue([
      {
        role: {
          id: 1,
          code: 'super_admin',
          name: '超级管理员',
          status: 'active',
          rolePermissions: [
            {
              permission: {
                code: 'system.user.view',
                status: 'active',
              },
            },
          ],
        },
      },
    ])

    const result = await service.getPermission(9)

    expect(result.permissions).toContain('system.wechat-share.view')
    expect(result.permissions).toContain('system.wechat-share.update')
  })
})
