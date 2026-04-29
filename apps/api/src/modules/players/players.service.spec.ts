import { PlayersService } from './players.service'

describe('PlayersService', () => {
  const createService = () => {
    const prisma = {
      player: {
        create: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      $transaction: jest.fn((actions: Promise<unknown>[]) => Promise.all(actions)),
    }

    const service = new PlayersService(prisma as any)

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
})
