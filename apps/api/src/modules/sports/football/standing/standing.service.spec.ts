import { BadRequestException } from '@nestjs/common'
import { Prisma } from '@prisma/client'

import { StandingService } from './standing.service'

describe('StandingService', () => {
  const createService = () => {
    const prisma = {
      team: {
        findMany: jest.fn(),
      },
      matchRound: {
        findMany: jest.fn(),
      },
      $transaction: jest.fn(async (input: unknown) => Promise.all(input as Promise<unknown>[])),
    }

    return {
      prisma,
      service: new StandingService(prisma as any),
    }
  }

  it('aggregates one season into rounds, per-round points, and total points', async () => {
    const { prisma, service } = createService()

    prisma.team.findMany.mockResolvedValue([
      { id: 1, code: 'real', name: '皇家高歌', sort: 1 },
      { id: 2, code: 'inter', name: '高歌国际', sort: 2 },
      { id: 3, code: 'united', name: '高歌联', sort: 3 },
    ])
    prisma.matchRound.findMany.mockResolvedValue([
      {
        id: 11,
        year: 2026,
        season: '春季赛',
        round: 1,
        matchDate: new Date('2026-03-01T12:00:00.000Z'),
        results: [
          { teamId: 1, rank: 1, points: 2 },
          { teamId: 2, rank: 2, points: 1 },
          { teamId: 3, rank: 3, points: 0 },
        ],
      },
      {
        id: 12,
        year: 2026,
        season: '春季赛',
        round: 2,
        matchDate: new Date('2026-03-08T12:00:00.000Z'),
        results: [
          { teamId: 2, rank: 1, points: 2 },
          { teamId: 3, rank: 2, points: 1 },
          { teamId: 1, rank: 3, points: 0 },
        ],
      },
    ])

    await expect(service.findSeasonStanding({ year: 2026, season: '春季赛' })).resolves.toEqual({
      season: {
        year: 2026,
        season: '春季赛',
      },
      rounds: [
        { id: 11, round: 1, matchDate: '2026-03-01T12:00:00.000Z', label: '第1轮' },
        { id: 12, round: 2, matchDate: '2026-03-08T12:00:00.000Z', label: '第2轮' },
      ],
      teams: [
        { teamId: 2, teamCode: 'inter', teamName: '高歌国际', totalPoints: 3, roundPoints: [1, 2] },
        { teamId: 1, teamCode: 'real', teamName: '皇家高歌', totalPoints: 2, roundPoints: [2, 0] },
        { teamId: 3, teamCode: 'united', teamName: '高歌联', totalPoints: 1, roundPoints: [0, 1] },
      ],
    })

    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Array), {
      isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
    })
  })

  it('returns three zero-point teams for an empty season', async () => {
    const { prisma, service } = createService()

    prisma.team.findMany.mockResolvedValue([
      { id: 1, code: 'real', name: '皇家高歌', sort: 1 },
      { id: 2, code: 'inter', name: '高歌国际', sort: 2 },
      { id: 3, code: 'united', name: '高歌联', sort: 3 },
    ])
    prisma.matchRound.findMany.mockResolvedValue([])

    await expect(service.findSeasonStanding({ year: 2026, season: '春季赛' })).resolves.toEqual({
      season: {
        year: 2026,
        season: '春季赛',
      },
      rounds: [],
      teams: [
        { teamId: 1, teamCode: 'real', teamName: '皇家高歌', totalPoints: 0, roundPoints: [] },
        { teamId: 2, teamCode: 'inter', teamName: '高歌国际', totalPoints: 0, roundPoints: [] },
        { teamId: 3, teamCode: 'united', teamName: '高歌联', totalPoints: 0, roundPoints: [] },
      ],
    })
  })

  it('rejects missing season parameters', async () => {
    const { service } = createService()

    await expect(
      service.findSeasonStanding({ year: '', season: undefined as never }),
    ).rejects.toThrow(new BadRequestException('year 和 season 为必填参数'))
  })

  it('rejects invalid season enum values', async () => {
    const { service } = createService()

    await expect(
      service.findSeasonStanding({ year: 2026, season: 'foo' as never }),
    ).rejects.toThrow(new BadRequestException('season 参数不合法'))
  })

  it('rejects non-fixed football team rosters', async () => {
    const { prisma, service } = createService()

    prisma.team.findMany.mockResolvedValue([
      { id: 1, code: 'real', name: '皇家高歌', sort: 1 },
      { id: 2, code: 'inter', name: '高歌国际', sort: 2 },
    ])
    prisma.matchRound.findMany.mockResolvedValue([])

    await expect(service.findSeasonStanding({ year: 2026, season: '春季赛' })).rejects.toThrow(
      new BadRequestException('球队数据不是固定的 3 支足球队'),
    )
  })

  it('rejects rounds with missing team results', async () => {
    const { prisma, service } = createService()

    prisma.team.findMany.mockResolvedValue([
      { id: 1, code: 'real', name: '皇家高歌', sort: 1 },
      { id: 2, code: 'inter', name: '高歌国际', sort: 2 },
      { id: 3, code: 'united', name: '高歌联', sort: 3 },
    ])
    prisma.matchRound.findMany.mockResolvedValue([
      {
        id: 11,
        year: 2026,
        season: '春季赛',
        round: 1,
        matchDate: new Date('2026-03-01T12:00:00.000Z'),
        results: [
          { teamId: 1, rank: 1, points: 2 },
          { teamId: 2, rank: 2, points: 1 },
        ],
      },
    ])

    await expect(service.findSeasonStanding({ year: 2026, season: '春季赛' })).rejects.toThrow(
      new BadRequestException('赛季积分数据不完整'),
    )
  })

  it('rejects rounds with duplicate teams', async () => {
    const { prisma, service } = createService()

    prisma.team.findMany.mockResolvedValue([
      { id: 1, code: 'real', name: '皇家高歌', sort: 1 },
      { id: 2, code: 'inter', name: '高歌国际', sort: 2 },
      { id: 3, code: 'united', name: '高歌联', sort: 3 },
    ])
    prisma.matchRound.findMany.mockResolvedValue([
      {
        id: 11,
        year: 2026,
        season: '春季赛',
        round: 1,
        matchDate: new Date('2026-03-01T12:00:00.000Z'),
        results: [
          { teamId: 1, rank: 1, points: 2 },
          { teamId: 1, rank: 2, points: 1 },
          { teamId: 3, rank: 3, points: 0 },
        ],
      },
    ])

    await expect(service.findSeasonStanding({ year: 2026, season: '春季赛' })).rejects.toThrow(
      new BadRequestException('赛季积分数据存在重复球队'),
    )
  })

  it('rejects rounds with foreign teams outside the fixed roster', async () => {
    const { prisma, service } = createService()

    prisma.team.findMany.mockResolvedValue([
      { id: 1, code: 'real', name: '皇家高歌', sort: 1 },
      { id: 2, code: 'inter', name: '高歌国际', sort: 2 },
      { id: 3, code: 'united', name: '高歌联', sort: 3 },
    ])
    prisma.matchRound.findMany.mockResolvedValue([
      {
        id: 11,
        year: 2026,
        season: '春季赛',
        round: 1,
        matchDate: new Date('2026-03-01T12:00:00.000Z'),
        results: [
          { teamId: 1, rank: 1, points: 2 },
          { teamId: 2, rank: 2, points: 1 },
          { teamId: 99, rank: 3, points: 0 },
        ],
      },
    ])

    await expect(service.findSeasonStanding({ year: 2026, season: '春季赛' })).rejects.toThrow(
      new BadRequestException('赛季积分数据存在无效球队'),
    )
  })

  it('breaks ties by sort asc then id asc', async () => {
    const { prisma, service } = createService()

    prisma.team.findMany.mockResolvedValue([
      { id: 1, code: 'real', name: '皇家高歌', sort: 3 },
      { id: 2, code: 'inter', name: '高歌国际', sort: 1 },
      { id: 3, code: 'united', name: '高歌联', sort: 1 },
    ])
    prisma.matchRound.findMany.mockResolvedValue([])

    await expect(
      service.findSeasonStanding({ year: 2026, season: '春季赛' }),
    ).resolves.toMatchObject({
      teams: [
        { teamId: 2, totalPoints: 0 },
        { teamId: 3, totalPoints: 0 },
        { teamId: 1, totalPoints: 0 },
      ],
    })
  })
})
