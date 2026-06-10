import { ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common'

import { MiniappService } from './miniapp.service'

describe('MiniappService', () => {
  const createService = () => {
    const tx = {
      player: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    }
    const prisma = {
      user: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      player: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(async (callback: (tx: typeof tx) => Promise<unknown>) => callback(tx)),
    }

    return {
      prisma,
      tx,
      service: new MiniappService(prisma as any),
    }
  }

  it('returns an unbound me payload for active miniapp users', async () => {
    const { service, prisma } = createService()

    prisma.user.findFirst.mockResolvedValue({
      id: 8,
      openid: 'wx-openid-8',
      nickname: '高歌用户',
      avatarUrl: 'https://example.com/u8.png',
      phone: '13800000000',
      status: 'active',
      deletedAt: null,
    })
    prisma.player.findFirst.mockResolvedValue(null)

    await expect(service.getMe(8)).resolves.toEqual({
      user: {
        id: 8,
        openid: 'wx-openid-8',
        nickname: '高歌用户',
        avatarUrl: 'https://example.com/u8.png',
        phone: '13800000000',
        status: 'active',
        isBound: false,
      },
      player: null,
    })

    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: {
        id: 8,
        status: 'active',
        deletedAt: null,
      },
      select: {
        id: true,
        openid: true,
        nickname: true,
        avatarUrl: true,
        phone: true,
        status: true,
        deletedAt: true,
      },
    })
    expect(prisma.player.findFirst).toHaveBeenCalledWith({
      where: {
        userId: 8,
      },
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

  it.each([
    {
      label: 'missing users',
      user: null,
    },
    {
      label: 'inactive users',
      user: {
        id: 31,
        openid: 'wx-openid-31',
        nickname: null,
        avatarUrl: null,
        phone: null,
        status: 'inactive',
        deletedAt: null,
      },
    },
    {
      label: 'deleted users',
      user: {
        id: 32,
        openid: 'wx-openid-32',
        nickname: null,
        avatarUrl: null,
        phone: null,
        status: 'active',
        deletedAt: new Date('2026-05-12T00:00:00.000Z'),
      },
    },
  ])('rejects $label with unauthorized semantics', async ({ user }) => {
    const { service, prisma } = createService()

    prisma.user.findFirst.mockResolvedValue(user)

    await expect(service.getMe(31)).rejects.toMatchObject({
      message: '用户不存在或已被禁用',
    })
    await expect(service.getMe(31)).rejects.toBeInstanceOf(UnauthorizedException)
    expect(prisma.player.findFirst).not.toHaveBeenCalled()
  })

  it('lists only unbound players with a player number in ascending order', async () => {
    const { service, prisma } = createService()

    prisma.player.findMany.mockResolvedValue([
      {
        id: 12,
        playerNumber: 7,
        nickname: '齐达内',
        subTeam: 'real',
      },
      {
        id: 15,
        playerNumber: 10,
        nickname: '劳塔罗',
        subTeam: 'inter',
      },
    ])

    await expect(service.listBindOptions()).resolves.toEqual({
      list: [
        {
          playerId: 12,
          playerNumber: 7,
          nickname: '齐达内',
          subTeam: 'real',
        },
        {
          playerId: 15,
          playerNumber: 10,
          nickname: '劳塔罗',
          subTeam: 'inter',
        },
      ],
    })

    expect(prisma.player.findMany).toHaveBeenCalledWith({
      where: {
        userId: null,
        playerNumber: {
          not: null,
        },
      },
      orderBy: {
        playerNumber: 'asc',
      },
      select: {
        id: true,
        playerNumber: true,
        nickname: true,
        subTeam: true,
      },
    })
  })

  it('rejects binding when the current user is already bound', async () => {
    const { service, prisma, tx } = createService()

    prisma.user.findFirst.mockResolvedValue({
      id: 21,
      openid: 'wx-openid-21',
      nickname: null,
      avatarUrl: null,
      phone: null,
      status: 'active',
      deletedAt: null,
    })
    tx.player.findFirst.mockResolvedValue({
      id: 66,
      playerNumber: 9,
      nickname: '贝巴',
      avatarUrl: null,
      realName: null,
      subTeam: 'united',
      jerseyName: null,
      birthDate: null,
      isAdmin: false,
      position: null,
      jerseySize: null,
      status: 'active',
      remark: null,
      createdAt: new Date('2026-05-01T00:00:00.000Z'),
      updatedAt: new Date('2026-05-01T00:00:00.000Z'),
    })

    await expect(service.bindFootballPlayer(21, 7)).rejects.toBeInstanceOf(ConflictException)

    expect(tx.player.findFirst).toHaveBeenCalledWith({
      where: {
        userId: 21,
      },
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
    expect(tx.player.update).not.toHaveBeenCalled()
  })

  it('binds an unbound user inside a transaction and returns the bound me payload', async () => {
    const { service, prisma, tx } = createService()

    prisma.user.findFirst.mockResolvedValue({
      id: 23,
      openid: 'wx-openid-23',
      nickname: '新绑定用户',
      avatarUrl: 'https://example.com/u23.png',
      phone: '13900000000',
      status: 'active',
      deletedAt: null,
    })
    tx.player.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({
      id: 88,
      playerNumber: 24,
      nickname: '沃克',
      avatarUrl: 'https://example.com/p88.png',
      realName: 'Kyle Walker',
      subTeam: 'real',
      jerseyName: 'WALKER',
      birthDate: new Date('1992-05-28T00:00:00.000Z'),
      isAdmin: false,
      position: 'defender',
      jerseySize: 'XL',
      status: 'active',
      remark: '速度快',
      createdAt: new Date('2026-05-01T08:00:00.000Z'),
      updatedAt: new Date('2026-05-12T09:30:00.000Z'),
      userId: null,
    })
    tx.player.update.mockResolvedValue({
      id: 88,
      playerNumber: 24,
      nickname: '沃克',
      avatarUrl: 'https://example.com/p88.png',
      realName: 'Kyle Walker',
      subTeam: 'real',
      jerseyName: 'WALKER',
      birthDate: new Date('1992-05-28T00:00:00.000Z'),
      isAdmin: false,
      position: 'defender',
      jerseySize: 'XL',
      status: 'active',
      remark: '速度快',
      createdAt: new Date('2026-05-01T08:00:00.000Z'),
      updatedAt: new Date('2026-05-12T09:30:00.000Z'),
    })

    await expect(service.bindFootballPlayer(23, 24)).resolves.toEqual({
      user: {
        id: 23,
        openid: 'wx-openid-23',
        nickname: '新绑定用户',
        avatarUrl: 'https://example.com/u23.png',
        phone: '13900000000',
        status: 'active',
        isBound: true,
      },
      player: {
        playerId: 88,
        playerNumber: 24,
        nickname: '沃克',
        avatarUrl: 'https://example.com/p88.png',
        realName: 'Kyle Walker',
        subTeam: 'real',
        jerseyName: 'WALKER',
        birthDate: '1992-05-28T00:00:00.000Z',
        isAdmin: false,
        position: 'defender',
        jerseySize: 'XL',
        status: 'active',
        remark: '速度快',
        createdAt: '2026-05-01T08:00:00.000Z',
        updatedAt: '2026-05-12T09:30:00.000Z',
      },
    })

    expect(prisma.$transaction).toHaveBeenCalledTimes(1)
    expect(tx.player.update).toHaveBeenCalledWith({
      where: {
        id: 88,
      },
      data: {
        userId: 23,
      },
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

  it('rejects binding when the target player number does not exist', async () => {
    const { service, prisma, tx } = createService()

    prisma.user.findFirst.mockResolvedValue({
      id: 22,
      openid: 'wx-openid-22',
      nickname: '未绑定用户',
      avatarUrl: null,
      phone: null,
      status: 'active',
      deletedAt: null,
    })
    tx.player.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(null)

    await expect(service.bindFootballPlayer(22, 100)).rejects.toBeInstanceOf(NotFoundException)

    expect(tx.player.findFirst).toHaveBeenNthCalledWith(1, {
      where: {
        userId: 22,
      },
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
    expect(tx.player.findFirst).toHaveBeenNthCalledWith(2, {
      where: {
        playerNumber: 100,
      },
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
        userId: true,
      },
    })
    expect(tx.player.update).not.toHaveBeenCalled()
  })

  it('updates the current bound player profile and returns the latest me payload', async () => {
    const { service, prisma } = createService()

    prisma.user.findFirst.mockResolvedValue({
      id: 41,
      openid: 'wx-openid-41',
      nickname: '用户昵称',
      avatarUrl: 'https://example.com/u41.png',
      phone: '13700000000',
      status: 'active',
      deletedAt: null,
    })
    prisma.player.findFirst.mockResolvedValue({
      id: 99,
      playerNumber: 7,
      nickname: '旧昵称',
      avatarUrl: 'https://example.com/p99-old.png',
      realName: 'Old Name',
      subTeam: 'real',
      jerseyName: 'OLD',
      birthDate: new Date('1990-06-10T00:00:00.000Z'),
      isAdmin: false,
      position: 'midfielder',
      jerseySize: 'M',
      status: 'active',
      remark: '旧备注',
      createdAt: new Date('2026-05-01T08:00:00.000Z'),
      updatedAt: new Date('2026-05-10T09:30:00.000Z'),
    })
    prisma.player.update.mockResolvedValue({
      id: 99,
      playerNumber: 7,
      nickname: '新昵称',
      avatarUrl: 'https://example.com/p99-new.png',
      realName: 'New Name',
      subTeam: 'real',
      jerseyName: 'NEW',
      birthDate: new Date('1991-06-11T00:00:00.000Z'),
      isAdmin: false,
      position: 'forward',
      jerseySize: 'L',
      status: 'active',
      remark: '新备注',
      createdAt: new Date('2026-05-01T08:00:00.000Z'),
      updatedAt: new Date('2026-05-12T09:30:00.000Z'),
    })

    await expect(
      service.updateProfile(41, {
        nickname: '  新昵称  ',
        realName: '  New Name  ',
        subTeam: '  real  ',
        jerseyName: '  NEW  ',
        birthDate: new Date('1991-06-11T00:00:00.000Z'),
        position: '  forward  ',
        jerseySize: '  L  ',
        remark: '  新备注  ',
        avatarUrl: 'https://example.com/p99-new.png',
      }),
    ).resolves.toEqual({
      user: {
        id: 41,
        openid: 'wx-openid-41',
        nickname: '用户昵称',
        avatarUrl: 'https://example.com/u41.png',
        phone: '13700000000',
        status: 'active',
        isBound: true,
      },
      player: {
        playerId: 99,
        playerNumber: 7,
        nickname: '新昵称',
        avatarUrl: 'https://example.com/p99-new.png',
        realName: 'New Name',
        subTeam: 'real',
        jerseyName: 'NEW',
        birthDate: '1991-06-11T00:00:00.000Z',
        isAdmin: false,
        position: 'forward',
        jerseySize: 'L',
        status: 'active',
        remark: '新备注',
        createdAt: '2026-05-01T08:00:00.000Z',
        updatedAt: '2026-05-12T09:30:00.000Z',
      },
    })

    expect(prisma.player.update).toHaveBeenCalledWith({
      where: {
        id: 99,
      },
      data: {
        nickname: '新昵称',
        avatarUrl: 'https://example.com/p99-new.png',
        realName: 'New Name',
        subTeam: 'real',
        jerseyName: 'NEW',
        birthDate: new Date('1991-06-11T00:00:00.000Z'),
        position: 'forward',
        jerseySize: 'L',
        remark: '新备注',
      },
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
    expect(prisma.user.update).not.toHaveBeenCalled()
  })

  it('rejects profile updates when the current user has not bound a player', async () => {
    const { service, prisma } = createService()

    prisma.user.findFirst.mockResolvedValue({
      id: 51,
      openid: 'wx-openid-51',
      nickname: '未绑定用户',
      avatarUrl: null,
      phone: null,
      status: 'active',
      deletedAt: null,
    })
    prisma.player.findFirst.mockResolvedValue(null)

    await expect(service.updateProfile(51, { nickname: '新昵称' })).rejects.toBeInstanceOf(
      NotFoundException,
    )

    expect(prisma.player.update).not.toHaveBeenCalled()
  })
})
