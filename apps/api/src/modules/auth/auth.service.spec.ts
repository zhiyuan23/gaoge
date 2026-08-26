import { BadRequestException, UnauthorizedException } from '@nestjs/common'

import { hashPassword, verifyPassword } from '@/common/auth/password.util'
import { deletePreviousAdminAvatarUrls } from '@/common/storage/admin-avatar-storage'

import { AuthService } from './auth.service'

jest.mock('@/common/storage/admin-avatar-storage', () => ({
  deletePreviousAdminAvatarUrls: jest.fn().mockResolvedValue(undefined),
}))

const miniappPlayerProfileSelectExpectation = {
  id: true,
  playerNumber: true,
  nickname: true,
  avatarUrl: true,
  realName: true,
  subTeam: true,
  primaryTeamId: true,
  primaryTeam: true,
  playerTeams: {
    include: {
      team: true,
    },
  },
  jerseyName: true,
  birthDate: true,
  isAdmin: true,
  position: true,
  positions: true,
  primaryPosition: true,
  signature: true,
  jerseySize: true,
  status: true,
  remark: true,
  createdAt: true,
  updatedAt: true,
}

const teamSummary = {
  id: 1,
  code: 'real',
  name: '皇家高歌',
  avatarUrl: null,
  slogan: null,
  sponsorName: null,
  sort: 0,
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-01T00:00:00.000Z',
}

const teamRecord = {
  ...teamSummary,
  createdAt: new Date(teamSummary.createdAt),
  updatedAt: new Date(teamSummary.updatedAt),
}

const playerProfileExtras = {
  teamIds: [1],
  teams: [teamSummary],
  primaryTeamId: 1,
  primaryTeam: teamSummary,
  positions: ['central_midfielder'],
  primaryPosition: 'central_midfielder',
  signature: '大师风范',
}

const playerProfileRelationFields = {
  primaryTeamId: 1,
  primaryTeam: teamRecord,
  playerTeams: [
    {
      teamId: 1,
      team: teamRecord,
    },
  ],
  positions: ['central_midfielder'],
  primaryPosition: 'central_midfielder',
  signature: '大师风范',
}

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
    const permissionResolver = {
      resolve: jest.fn(),
    }

    return {
      prisma,
      wechatService,
      jwtService,
      service: new AuthService(
        wechatService as any,
        prisma as any,
        jwtService as any,
        permissionResolver as any,
      ),
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
      select: miniappPlayerProfileSelectExpectation,
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
      ...playerProfileRelationFields,
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
        ...playerProfileExtras,
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
  beforeEach(() => {
    jest.mocked(deletePreviousAdminAvatarUrls).mockClear()
  })

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
        deleteMany: jest.fn(),
      },
      $transaction: jest.fn(async (input: unknown) => {
        if (Array.isArray(input)) {
          return Promise.all(input)
        }

        return (input as (tx: any) => Promise<unknown>)(prisma)
      }),
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
    const permissionResolver = {
      resolve: jest.fn().mockResolvedValue({ roles: [], permissions: [] }),
    }

    return {
      prisma,
      wechatService,
      jwtService,
      permissionResolver,
      service: new AuthService(
        wechatService as any,
        prisma as any,
        jwtService as any,
        permissionResolver as any,
      ),
    }
  }

  it('rejects admin login when the backend account has no active role', async () => {
    const { service, prisma, permissionResolver } = createService()

    prisma.user.findFirst.mockResolvedValue({
      id: 1,
      account: 'admin',
      passwordHash: await hashPassword('Admin@123456'),
      role: 'admin',
      status: 'active',
      deletedAt: null,
    })
    permissionResolver.resolve.mockResolvedValue({ roles: [], permissions: [] })

    await expect(
      service.adminLogin({
        account: 'admin',
        password: 'Admin@123456',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException)
  })

  it('aggregates permissions from multiple active roles and filters inactive entries', async () => {
    const { service, prisma, permissionResolver } = createService()

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
    permissionResolver.resolve.mockResolvedValue({
      permissions: ['system.permission.view', 'system.user.view', 'system.wechat-share.view'],
      roles: [
        { id: 11, code: 'super_admin', name: '超级管理员', status: 'active' },
        { id: 12, code: 'auditor', name: '审计员', status: 'active' },
      ],
    })

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
    const { service, prisma, permissionResolver } = createService()

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
    permissionResolver.resolve.mockResolvedValue({
      permissions: ['system.user.view', 'system.wechat-share.view', 'system.wechat-share.update'],
      roles: [{ id: 1, code: 'super_admin', name: '超级管理员', status: 'active' }],
    })

    const result = await service.getPermission(9)

    expect(result.permissions).toContain('system.wechat-share.view')
    expect(result.permissions).toContain('system.wechat-share.update')
  })

  it('updates the current admin profile and returns the latest serialized user', async () => {
    const { service, prisma } = createService()
    const oldAvatar =
      'https://gaoge-assets.oss-cn-beijing.aliyuncs.com/gaoge/admin-avatar/9/old.png'

    prisma.user.findUnique.mockResolvedValue({
      id: 9,
      account: 'admin',
      openid: null,
      nickname: 'Admin',
      avatarUrl: oldAvatar,
      phone: null,
      role: 'admin',
      status: 'active',
      deletedAt: null,
      lastLoginAt: new Date('2026-07-15T08:00:00.000Z'),
    })
    prisma.user.update.mockResolvedValue({
      id: 9,
      account: 'admin',
      openid: null,
      nickname: '新昵称',
      avatarUrl: 'https://example.com/avatar.png',
      phone: null,
      role: 'admin',
      status: 'active',
      deletedAt: null,
      lastLoginAt: new Date('2026-07-16T08:00:00.000Z'),
    })

    await expect(
      service.updateProfile(9, {
        nickname: '  新昵称  ',
        avatarUrl: ' https://example.com/avatar.png ',
      }),
    ).resolves.toMatchObject({
      id: 9,
      account: 'admin',
      nickname: '新昵称',
      avatarUrl: 'https://example.com/avatar.png',
    })

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 9 },
      data: {
        nickname: '新昵称',
        avatarUrl: 'https://example.com/avatar.png',
      },
    })
    expect(deletePreviousAdminAvatarUrls).toHaveBeenCalledWith({
      nextAvatarUrl: 'https://example.com/avatar.png',
      previousAvatarUrls: [oldAvatar],
      userId: 9,
    })
  })

  it('updates the current admin avatar and deletes the previous managed avatar', async () => {
    const { service, prisma } = createService()
    const oldAvatar =
      'https://gaoge-assets.oss-cn-beijing.aliyuncs.com/gaoge/admin-avatar/9/old.png'
    const nextAvatar =
      'https://gaoge-assets.oss-cn-beijing.aliyuncs.com/gaoge/admin-avatar/9/new.png'

    prisma.user.findUnique.mockResolvedValue({
      id: 9,
      account: 'admin',
      openid: null,
      nickname: 'Admin',
      avatarUrl: oldAvatar,
      phone: null,
      role: 'admin',
      status: 'active',
      deletedAt: null,
      lastLoginAt: new Date('2026-07-15T08:00:00.000Z'),
    })
    prisma.user.update.mockResolvedValue({
      id: 9,
      account: 'admin',
      openid: null,
      nickname: 'Admin',
      avatarUrl: nextAvatar,
      phone: null,
      role: 'admin',
      status: 'active',
      deletedAt: null,
      lastLoginAt: new Date('2026-07-16T08:00:00.000Z'),
    })

    await expect(service.updateProfileAvatar(9, nextAvatar)).resolves.toMatchObject({
      id: 9,
      avatarUrl: nextAvatar,
    })

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 9 },
      data: {
        avatarUrl: nextAvatar,
      },
    })
    expect(deletePreviousAdminAvatarUrls).toHaveBeenCalledWith({
      nextAvatarUrl: nextAvatar,
      previousAvatarUrls: [oldAvatar],
      userId: 9,
    })
  })

  it('changes the current admin password and revokes refresh tokens', async () => {
    const { service, prisma } = createService()
    const passwordHash = await hashPassword('Admin@123456')

    prisma.user.findUnique.mockResolvedValue({
      id: 9,
      account: 'admin',
      passwordHash,
      status: 'active',
      deletedAt: null,
    })
    prisma.user.update.mockResolvedValue({ id: 9 })
    prisma.refreshToken.deleteMany.mockResolvedValue({ count: 2 })

    await expect(
      service.changePassword(9, {
        currentPassword: 'Admin@123456',
        newPassword: 'Admin@654321',
      }),
    ).resolves.toEqual({ message: '密码修改成功，请重新登录' })

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 9 },
      data: {
        passwordHash: expect.any(String),
      },
    })
    expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({ where: { userId: 9 } })

    const updatedHash = (prisma.user.update.mock.calls[0]?.[0] as any).data.passwordHash
    await expect(verifyPassword('Admin@654321', updatedHash)).resolves.toBe(true)
  })

  it('rejects password changes when the current password is wrong', async () => {
    const { service, prisma } = createService()

    prisma.user.findUnique.mockResolvedValue({
      id: 9,
      passwordHash: await hashPassword('Admin@123456'),
      status: 'active',
      deletedAt: null,
    })

    await expect(
      service.changePassword(9, {
        currentPassword: 'Wrong@123456',
        newPassword: 'Admin@654321',
      }),
    ).rejects.toBeInstanceOf(BadRequestException)
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  it('rejects password changes when the new password matches the current password', async () => {
    const { service, prisma } = createService()
    const passwordHash = await hashPassword('Admin@123456')

    prisma.user.findUnique.mockResolvedValue({
      id: 9,
      passwordHash,
      status: 'active',
      deletedAt: null,
    })

    await expect(
      service.changePassword(9, {
        currentPassword: 'Admin@123456',
        newPassword: 'Admin@123456',
      }),
    ).rejects.toBeInstanceOf(BadRequestException)
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })
})
