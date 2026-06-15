import { BadRequestException, Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'

import type {
  FootballStandingParams,
  FootballStandingResponse,
  MatchRoundSeason,
  TeamCode,
} from '@gaoge/shared-types'

import { PrismaService } from '@/common/prisma/prisma.service'

const MATCH_ROUND_SEASONS = ['春季赛', '夏季赛', '秋季赛', '冬季赛'] as const
const FIXED_FOOTBALL_TEAMS = [
  { code: 'real', name: '皇家高歌' },
  { code: 'inter', name: '高歌国际' },
  { code: 'united', name: '高歌联' },
] as const

type StandingTeamRecord = {
  id: number
  code: TeamCode
  name: string
  sort: number
}

type StandingRoundRecord = {
  id: number
  year: number
  season: MatchRoundSeason
  round: number
  matchDate: Date
  results: Array<{
    teamId: number
    rank: number
    points: number
  }>
}

@Injectable()
export class StandingService {
  constructor(private readonly prisma: PrismaService) {}

  async findSeasonStanding(params: FootballStandingParams): Promise<FootballStandingResponse> {
    const year = normalizeRequiredYear(params.year)
    const season = normalizeRequiredSeason(params.season)

    const [teams, rounds] = (await this.prisma.$transaction(
      [
        this.prisma.team.findMany({
          orderBy: [{ sort: 'asc' }, { id: 'asc' }],
          select: {
            id: true,
            code: true,
            name: true,
            sort: true,
          },
        }),
        this.prisma.matchRound.findMany({
          where: {
            year,
            season,
          },
          orderBy: [{ round: 'asc' }, { matchDate: 'asc' }, { id: 'asc' }],
          include: {
            results: {
              orderBy: {
                rank: 'asc',
              },
              select: {
                teamId: true,
                rank: true,
                points: true,
              },
            },
          },
        }),
      ],
      {
        isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
      },
    )) as [StandingTeamRecord[], StandingRoundRecord[]]

    validateFixedFootballTeams(teams)
    validateSeasonData(teams, rounds)

    const roundItems = rounds.map((round) => ({
      id: round.id,
      round: round.round,
      matchDate: round.matchDate.toISOString(),
      label: `第${round.round}轮`,
    }))

    const roundPointsByTeamId = new Map<number, number[]>()
    for (const team of teams) {
      roundPointsByTeamId.set(team.id, [])
    }

    for (const round of rounds) {
      for (const result of round.results) {
        roundPointsByTeamId.get(result.teamId)?.push(result.points)
      }
    }

    const standingTeams = teams
      .map((team) => {
        const roundPoints = roundPointsByTeamId.get(team.id) ?? []

        return {
          teamId: team.id,
          teamCode: team.code,
          teamName: team.name,
          totalPoints: roundPoints.reduce((sum, points) => sum + points, 0),
          roundPoints,
          sort: team.sort,
        }
      })
      .sort((left, right) => {
        if (right.totalPoints !== left.totalPoints) {
          return right.totalPoints - left.totalPoints
        }

        if (left.sort !== right.sort) {
          return left.sort - right.sort
        }

        return left.teamId - right.teamId
      })
      .map(({ sort: _sort, ...team }) => team)

    return {
      season: {
        year,
        season,
      },
      rounds: roundItems,
      teams: standingTeams,
    }
  }
}

function normalizeRequiredYear(value: FootballStandingParams['year']) {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new BadRequestException('year 和 season 为必填参数')
  }

  return parsed
}

function normalizeRequiredSeason(value: FootballStandingParams['season']) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new BadRequestException('year 和 season 为必填参数')
  }

  const season = value.trim()

  if (!MATCH_ROUND_SEASONS.includes(season as MatchRoundSeason)) {
    throw new BadRequestException('season 参数不合法')
  }

  return season as MatchRoundSeason
}

function validateFixedFootballTeams(teams: StandingTeamRecord[]) {
  if (teams.length !== FIXED_FOOTBALL_TEAMS.length) {
    throw new BadRequestException('球队数据不是固定的 3 支足球队')
  }

  const teamByCode = new Map(teams.map((team) => [team.code, team]))

  for (const expectedTeam of FIXED_FOOTBALL_TEAMS) {
    const actualTeam = teamByCode.get(expectedTeam.code)

    if (!actualTeam || actualTeam.name !== expectedTeam.name) {
      throw new BadRequestException('球队数据不是固定的 3 支足球队')
    }
  }
}

function validateSeasonData(teams: StandingTeamRecord[], rounds: StandingRoundRecord[]) {
  const teamIdSet = new Set(teams.map((team) => team.id))

  for (const round of rounds) {
    if (round.results.length !== teams.length) {
      throw new BadRequestException('赛季积分数据不完整')
    }

    const roundTeamIds = round.results.map((result) => result.teamId)

    if (new Set(roundTeamIds).size !== teams.length) {
      throw new BadRequestException('赛季积分数据存在重复球队')
    }

    for (const result of round.results) {
      if (!teamIdSet.has(result.teamId)) {
        throw new BadRequestException('赛季积分数据存在无效球队')
      }
    }
  }
}
