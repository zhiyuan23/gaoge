import { BadRequestException, NotFoundException } from '@nestjs/common'

import { MatchRoundService } from './match-round.service'

describe('MatchRoundService', () => {
  const createService = () => {
    const tx = {
      team: {
        count: jest.fn().mockResolvedValue(3),
      },
      footballAssetRecord: {
        create: jest.fn(),
      },
      matchRound: {
        create: jest.fn(),
        update: jest.fn(),
        findUnique: jest.fn(),
      },
      matchRoundResult: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
    }
    const prisma = {
      matchRound: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn(async (input: unknown) => {
        if (typeof input === 'function') {
          return input(tx)
        }

        return Promise.all(input as Promise<unknown>[])
      }),
    }

    const service = new MatchRoundService(prisma as any)

    return {
      prisma,
      service,
      tx,
    }
  }

  const roundRecord = {
    id: 1,
    year: 2026,
    season: '春季赛',
    round: 1,
    collectTeamFee: true,
    matchDate: new Date('2026-04-28T20:00:00.000Z'),
    venue: '体育中心',
    remark: '周中补赛',
    createdAt: new Date('2026-04-28T12:00:00.000Z'),
    updatedAt: new Date('2026-04-28T12:30:00.000Z'),
    results: [
      {
        teamId: 3,
        rank: 1,
        points: 2,
        team: {
          name: '皇家高歌',
        },
      },
      {
        teamId: 2,
        rank: 2,
        points: 1,
        team: {
          name: '国际高歌',
        },
      },
      {
        teamId: 1,
        rank: 3,
        points: 0,
        team: {
          name: '联队高歌',
        },
      },
    ],
  }

  it('creates a match round in a transaction and derives points from rank', async () => {
    const { prisma, service, tx } = createService()
    tx.matchRound.create.mockResolvedValue({ id: 8 })
    tx.footballAssetRecord.create.mockResolvedValue({ id: 18 })
    tx.matchRound.findUnique.mockResolvedValue({
      ...roundRecord,
      id: 8,
    })

    await expect(
      service.create({
        year: 2026,
        season: '春季赛',
        round: 2,
        matchDate: new Date('2026-04-28T20:00:00.000Z'),
        venue: ' 体育中心 ',
        remark: ' ',
        results: [
          { teamId: 11, rank: 2, points: 999 as never },
          { teamId: 12, rank: 1, points: 999 as never },
          { teamId: 13, rank: 3, points: 999 as never },
        ],
      } as any),
    ).resolves.toMatchObject({
      id: 8,
      year: 2026,
      season: '春季赛',
      round: 1,
      results: [
        expect.objectContaining({ teamId: 3, rank: 1, points: 2, teamName: '皇家高歌' }),
        expect.objectContaining({ teamId: 2, rank: 2, points: 1, teamName: '国际高歌' }),
        expect.objectContaining({ teamId: 1, rank: 3, points: 0, teamName: '联队高歌' }),
      ],
    })

    expect(prisma.$transaction).toHaveBeenCalled()
    expect(tx.team.count).toHaveBeenCalledWith({
      where: {
        id: {
          in: [11, 12, 13],
        },
      },
    })
    expect(tx.matchRound.create).toHaveBeenCalledWith({
      data: {
        year: 2026,
        season: '春季赛',
        round: 2,
        collectTeamFee: true,
        matchDate: new Date('2026-04-28T20:00:00.000Z'),
        venue: '体育中心',
        remark: null,
      },
    })
    expect(tx.matchRoundResult.createMany).toHaveBeenCalledWith({
      data: [
        { matchRoundId: 8, teamId: 11, rank: 2, points: 1 },
        { matchRoundId: 8, teamId: 12, rank: 1, points: 2 },
        { matchRoundId: 8, teamId: 13, rank: 3, points: 0 },
      ],
    })
    expect(tx.footballAssetRecord.create).toHaveBeenCalledWith({
      data: {
        direction: 'income',
        recordType: 'match_fee',
        amount: 2000,
        seasonLabel: null,
        matchLabel: '2026年春季赛第2轮',
        isWaived: false,
        title: '球队建设费',
        description: null,
        recordDate: new Date('2026-04-28T20:00:00.000Z'),
        status: 'confirmed',
        creatorId: null,
      },
    })
  })

  it('skips asset income creation when collectTeamFee is false', async () => {
    const { service, tx } = createService()
    tx.matchRound.create.mockResolvedValue({ id: 9 })
    tx.matchRound.findUnique.mockResolvedValue({
      ...roundRecord,
      id: 9,
      collectTeamFee: false,
    })

    await expect(
      service.create({
        year: 2026,
        season: '春季赛',
        round: 3,
        collectTeamFee: false,
        matchDate: new Date('2026-05-05T20:00:00.000Z'),
        results: [
          { teamId: 11, rank: 1 },
          { teamId: 12, rank: 2 },
          { teamId: 13, rank: 3 },
        ],
      } as any),
    ).resolves.toMatchObject({
      id: 9,
      collectTeamFee: false,
    })

    expect(tx.matchRound.create).toHaveBeenCalledWith({
      data: {
        year: 2026,
        season: '春季赛',
        round: 3,
        collectTeamFee: false,
        matchDate: new Date('2026-05-05T20:00:00.000Z'),
        venue: undefined,
        remark: undefined,
      },
    })
    expect(tx.footballAssetRecord.create).not.toHaveBeenCalled()
  })

  it('rejects results when a team id is zero or negative', async () => {
    const { service } = createService()

    await expect(
      service.create({
        year: 2026,
        season: '春季赛',
        round: 1,
        matchDate: new Date('2026-04-28T20:00:00.000Z'),
        results: [
          { teamId: 0, rank: 1 },
          { teamId: 2, rank: 2 },
          { teamId: 3, rank: 3 },
        ],
      } as any),
    ).rejects.toThrow(new BadRequestException('比赛结果中的球队 ID 无效'))
  })

  it('rejects results when some teams do not exist', async () => {
    const { service, tx } = createService()
    tx.team.count.mockResolvedValue(2)

    await expect(
      service.create({
        year: 2026,
        season: '春季赛',
        round: 1,
        matchDate: new Date('2026-04-28T20:00:00.000Z'),
        results: [
          { teamId: 11, rank: 1 },
          { teamId: 12, rank: 2 },
          { teamId: 13, rank: 3 },
        ],
      } as any),
    ).rejects.toThrow(new BadRequestException('比赛结果中存在不存在的球队'))

    expect(tx.matchRound.create).not.toHaveBeenCalled()
    expect(tx.matchRoundResult.createMany).not.toHaveBeenCalled()
  })

  it('rejects results when the match does not contain exactly three entries', async () => {
    const { service } = createService()

    await expect(
      service.create({
        year: 2026,
        season: '春季赛',
        round: 1,
        matchDate: new Date('2026-04-28T20:00:00.000Z'),
        results: [
          { teamId: 1, rank: 1 },
          { teamId: 2, rank: 2 },
        ],
      } as any),
    ).rejects.toThrow(new BadRequestException('比赛结果必须正好 3 条'))
  })

  it('rejects results when team ids are duplicated', async () => {
    const { service } = createService()

    await expect(
      service.create({
        year: 2026,
        season: '春季赛',
        round: 1,
        matchDate: new Date('2026-04-28T20:00:00.000Z'),
        results: [
          { teamId: 1, rank: 1 },
          { teamId: 1, rank: 2 },
          { teamId: 3, rank: 3 },
        ],
      } as any),
    ).rejects.toThrow(new BadRequestException('比赛结果中的 teamId 不能重复'))
  })

  it('rejects results when ranks are not exactly 1 2 3', async () => {
    const { service } = createService()

    await expect(
      service.create({
        year: 2026,
        season: '春季赛',
        round: 1,
        matchDate: new Date('2026-04-28T20:00:00.000Z'),
        results: [
          { teamId: 1, rank: 1 },
          { teamId: 2, rank: 1 },
          { teamId: 3, rank: 3 },
        ],
      } as any),
    ).rejects.toThrow(new BadRequestException('比赛结果名次必须且只能覆盖 1、2、3'))
  })

  it('returns paged list with filters, team names and match ordering', async () => {
    const { prisma, service } = createService()
    prisma.matchRound.findMany.mockResolvedValue([roundRecord])
    prisma.matchRound.count.mockResolvedValue(5)

    await expect(
      service.findAll({
        page: '2',
        pageSize: '1',
        year: '2026',
        season: '春季赛',
        round: '1',
        matchDate: '2026-04-28',
        venueKeyword: '体育',
      } as any),
    ).resolves.toEqual({
      list: [
        {
          id: 1,
          year: 2026,
          season: '春季赛',
          round: 1,
          collectTeamFee: true,
          matchDate: new Date('2026-04-28T20:00:00.000Z'),
          venue: '体育中心',
          remark: '周中补赛',
          createdAt: new Date('2026-04-28T12:00:00.000Z'),
          updatedAt: new Date('2026-04-28T12:30:00.000Z'),
          results: [
            { teamId: 3, rank: 1, points: 2, teamName: '皇家高歌' },
            { teamId: 2, rank: 2, points: 1, teamName: '国际高歌' },
            { teamId: 1, rank: 3, points: 0, teamName: '联队高歌' },
          ],
        },
      ],
      total: 5,
    })

    expect(prisma.matchRound.findMany).toHaveBeenCalledWith({
      where: {
        year: 2026,
        season: '春季赛',
        round: 1,
        matchDate: {
          gte: new Date('2026-04-28T00:00:00.000Z'),
          lt: new Date('2026-04-29T00:00:00.000Z'),
        },
        venue: {
          contains: '体育',
          mode: 'insensitive',
        },
      },
      skip: 1,
      take: 1,
      orderBy: [{ matchDate: 'desc' }, { createdAt: 'desc' }],
      include: {
        results: {
          include: {
            team: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            rank: 'asc',
          },
        },
      },
    })
    expect(prisma.matchRound.count).toHaveBeenCalledWith({
      where: {
        year: 2026,
        season: '春季赛',
        round: 1,
        matchDate: {
          gte: new Date('2026-04-28T00:00:00.000Z'),
          lt: new Date('2026-04-29T00:00:00.000Z'),
        },
        venue: {
          contains: '体育',
          mode: 'insensitive',
        },
      },
    })
  })

  it('returns detail with team names when the round exists', async () => {
    const { prisma, service } = createService()
    prisma.matchRound.findUnique.mockResolvedValue(roundRecord)

    await expect(service.findOne(1)).resolves.toEqual({
      id: 1,
      year: 2026,
      season: '春季赛',
      round: 1,
      collectTeamFee: true,
      matchDate: new Date('2026-04-28T20:00:00.000Z'),
      venue: '体育中心',
      remark: '周中补赛',
      createdAt: new Date('2026-04-28T12:00:00.000Z'),
      updatedAt: new Date('2026-04-28T12:30:00.000Z'),
      results: [
        { teamId: 3, rank: 1, points: 2, teamName: '皇家高歌' },
        { teamId: 2, rank: 2, points: 1, teamName: '国际高歌' },
        { teamId: 1, rank: 3, points: 0, teamName: '联队高歌' },
      ],
    })
  })

  it('rejects detail serialization when stored results violate the three-team invariant', async () => {
    const { prisma, service } = createService()
    prisma.matchRound.findUnique.mockResolvedValue({
      ...roundRecord,
      results: roundRecord.results.slice(0, 2),
    })

    await expect(service.findOne(1)).rejects.toThrow(new BadRequestException('比赛结果数据异常'))
  })

  it('throws a not found exception when the round does not exist', async () => {
    const { prisma, service } = createService()
    prisma.matchRound.findUnique.mockResolvedValue(null)

    await expect(service.findOne(404)).rejects.toThrow(new NotFoundException('比赛不存在'))
  })

  it('updates the round by rebuilding results inside a transaction', async () => {
    const { prisma, service, tx } = createService()
    prisma.matchRound.findUnique.mockResolvedValue(roundRecord)
    tx.matchRound.update.mockResolvedValue({ id: 1 })
    tx.matchRound.findUnique.mockResolvedValue({
      ...roundRecord,
      venue: null,
      remark: null,
    })

    await expect(
      service.update(1, {
        year: 2026,
        season: '夏季赛',
        round: 3,
        collectTeamFee: false,
        venue: '  ',
        remark: '',
        results: [
          { teamId: 4, rank: 3 },
          { teamId: 5, rank: 1 },
          { teamId: 6, rank: 2 },
        ],
      } as any),
    ).resolves.toMatchObject({
      id: 1,
      year: 2026,
      season: '春季赛',
      round: 1,
      venue: null,
      remark: null,
    })

    expect(tx.matchRound.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        year: 2026,
        season: '夏季赛',
        round: 3,
        collectTeamFee: false,
        venue: null,
        remark: null,
      },
    })
    expect(tx.matchRoundResult.deleteMany).toHaveBeenCalledWith({
      where: {
        matchRoundId: 1,
      },
    })
    expect(tx.matchRoundResult.createMany).toHaveBeenCalledWith({
      data: [
        { matchRoundId: 1, teamId: 4, rank: 3, points: 0 },
        { matchRoundId: 1, teamId: 5, rank: 1, points: 2 },
        { matchRoundId: 1, teamId: 6, rank: 2, points: 1 },
      ],
    })
    expect(tx.footballAssetRecord.create).not.toHaveBeenCalled()
  })

  it('updates only the main round when results are omitted', async () => {
    const { prisma, service, tx } = createService()
    prisma.matchRound.findUnique.mockResolvedValue(roundRecord)
    tx.matchRound.findUnique.mockResolvedValue({
      ...roundRecord,
      venue: '新场地',
    })

    await expect(
      service.update(1, {
        year: 2026,
        season: '秋季赛',
        round: 4,
        collectTeamFee: false,
        venue: ' 新场地 ',
      } as any),
    ).resolves.toMatchObject({
      id: 1,
      year: 2026,
      season: '春季赛',
      round: 1,
      venue: '新场地',
    })

    expect(tx.matchRound.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        year: 2026,
        season: '秋季赛',
        round: 4,
        collectTeamFee: false,
        venue: '新场地',
      },
    })
    expect(tx.matchRoundResult.deleteMany).not.toHaveBeenCalled()
    expect(tx.matchRoundResult.createMany).not.toHaveBeenCalled()
    expect(tx.team.count).not.toHaveBeenCalled()
  })

  it('checks existence before delete', async () => {
    const { prisma, service } = createService()
    prisma.matchRound.findUnique.mockResolvedValue(null)

    await expect(service.remove(9)).rejects.toThrow(new NotFoundException('比赛不存在'))
    expect(prisma.matchRound.delete).not.toHaveBeenCalled()
  })
})
