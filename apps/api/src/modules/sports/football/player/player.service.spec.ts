import { PlayerService } from './player.service'

describe('PlayerService', () => {
  const createService = () => {
    const playerWithRelations = {
      id: 1,
      superheroName: '蝙蝠侠',
      primaryTeamId: 1,
      primaryTeam: null,
      positions: ['striker'],
      primaryPosition: 'striker',
      playerTeams: [
        {
          teamId: 1,
          team: {
            id: 1,
            name: '皇家高歌',
          },
        },
      ],
    }
    const prisma = {
      player: {
        create: jest.fn().mockResolvedValue({ id: 1 }),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findUnique: jest.fn().mockResolvedValue(playerWithRelations),
        update: jest.fn().mockResolvedValue(playerWithRelations),
      },
      team: {
        findMany: jest.fn().mockResolvedValue([
          { id: 1, name: '皇家高歌' },
          { id: 2, name: '高歌国际' },
        ]),
      },
      playerTeam: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      $transaction: jest.fn((actions: Promise<unknown>[] | ((tx: any) => Promise<unknown>)) =>
        typeof actions === 'function' ? actions(prisma) : Promise.all(actions),
      ),
    }

    const service = new PlayerService(prisma as any)

    return {
      prisma,
      service,
    }
  }

  it('matches keyword against nickname and player number only', async () => {
    const { prisma, service } = createService()

    await service.findAll({ keyword: '7' })

    expect(prisma.player.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            {
              nickname: {
                contains: '7',
                mode: 'insensitive',
              },
            },
            {
              playerNumber: 7,
            },
          ],
        },
      }),
    )
  })

  it('keeps sub team filtering as an exact match', async () => {
    const { prisma, service } = createService()

    await service.findAll({ subTeam: '皇家高歌' })

    expect(prisma.player.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          subTeam: '皇家高歌',
        },
      }),
    )
  })

  it('rejects primary team values outside representative teams', async () => {
    const { service } = createService()

    await expect(
      service.create({
        nickname: '高歌7号',
        playerNumber: 7,
        teamIds: [1],
        primaryTeamId: 2,
        positions: ['striker'],
      } as any),
    ).rejects.toThrow('主队必须包含在代表球队中')
  })

  it('rejects primary position values outside playable positions', async () => {
    const { service } = createService()

    await expect(
      service.update(1, {
        positions: ['striker'],
        primaryPosition: 'goalkeeper',
      } as any),
    ).rejects.toThrow('主位置必须包含在可踢位置中')
  })

  it('normalizes create payloads and rebuilds player team relations in a transaction', async () => {
    const { prisma, service } = createService()
    prisma.player.create.mockResolvedValue({
      id: 9,
      signature: '冲就完了',
      playerTeams: [],
    })

    await service.create({
      nickname: '高歌7号',
      playerNumber: 7,
      teamIds: [1, 2],
      primaryTeamId: 1,
      positions: ['striker'],
      primaryPosition: 'striker',
      signature: '  冲就完了  ',
    } as any)

    expect(prisma.$transaction).toHaveBeenCalled()
    expect(prisma.player.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          primaryTeamId: 1,
          positions: ['striker'],
          primaryPosition: 'striker',
          signature: '冲就完了',
        }),
      }),
    )
    expect(prisma.playerTeam.createMany).toHaveBeenCalledWith({
      data: [
        { playerId: 9, teamId: 1 },
        { playerId: 9, teamId: 2 },
      ],
    })
  })

  it('supports team and position list filters with team relation includes', async () => {
    const { prisma, service } = createService()

    await service.findAll({ teamId: 1, position: 'striker' } as any)

    expect(prisma.player.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          primaryTeam: true,
          playerTeams: expect.objectContaining({
            include: {
              team: true,
            },
          }),
        }),
        where: expect.objectContaining({
          positions: {
            has: 'striker',
          },
          playerTeams: {
            some: {
              teamId: 1,
            },
          },
        }),
      }),
    )
  })

  it('orders the list by player number ascending', async () => {
    const { prisma, service } = createService()

    await service.findAll()

    expect(prisma.player.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: {
          playerNumber: 'asc',
        },
      }),
    )
  })

  it('returns superhero names and persists explicit null clears', async () => {
    const { prisma, service } = createService()

    await expect(service.findOne(1)).resolves.toMatchObject({
      superheroName: '蝙蝠侠',
    })

    await service.update(1, {
      superheroName: null,
    })

    expect(prisma.player.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: expect.objectContaining({
        superheroName: null,
      }),
    })
  })
})
