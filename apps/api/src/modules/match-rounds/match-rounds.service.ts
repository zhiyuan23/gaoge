import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import type { Prisma } from '@prisma/client'

import type { MatchRoundListParams } from '@gaoge/shared-types'

import { PrismaService } from '../../common/prisma/prisma.service'

import type { CreateMatchRoundDto, MatchRoundResultDto } from './dto/create-match-round.dto'
import type { UpdateMatchRoundDto } from './dto/update-match-round.dto'

const MATCH_ROUND_INCLUDE = {
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
} as const

@Injectable()
export class MatchRoundsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMatchRoundDto) {
    const results = normalizeResults(dto.results)
    const data = normalizeCreateRoundPayload(dto)

    return this.prisma.$transaction(async (tx) => {
      await validateTeamResults(tx, results)

      const round = await tx.matchRound.create({ data })

      await tx.matchRoundResult.createMany({
        data: results.map((result) => ({
          matchRoundId: round.id,
          ...result,
        })),
      })

      const created = await tx.matchRound.findUnique({
        where: { id: round.id },
        include: MATCH_ROUND_INCLUDE,
      })

      if (!created) {
        throw new NotFoundException('比赛不存在')
      }

      return serializeMatchRound(created)
    })
  }

  async findAll(params: MatchRoundListParams = {}) {
    const page = normalizePositiveInteger(params.page, 1)
    const pageSize = normalizePositiveInteger(params.pageSize, 15)
    const where = buildMatchRoundWhere(params)
    const [list, total] = await this.prisma.$transaction([
      this.prisma.matchRound.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ matchDate: 'desc' }, { createdAt: 'desc' }],
        include: MATCH_ROUND_INCLUDE,
      }),
      this.prisma.matchRound.count({ where }),
    ])

    return {
      list: list.map(serializeMatchRound),
      total,
    }
  }

  async findOne(id: number) {
    const round = await this.prisma.matchRound.findUnique({
      where: { id },
      include: MATCH_ROUND_INCLUDE,
    })

    if (!round) {
      throw new NotFoundException('比赛不存在')
    }

    return serializeMatchRound(round)
  }

  async update(id: number, dto: UpdateMatchRoundDto) {
    await this.findOne(id)

    const results = dto.results ? normalizeResults(dto.results) : undefined
    const data = normalizeUpdateRoundPayload(dto)

    return this.prisma.$transaction(async (tx) => {
      if (results) {
        await validateTeamResults(tx, results)
      }

      await tx.matchRound.update({
        where: { id },
        data,
      })

      if (results) {
        await tx.matchRoundResult.deleteMany({
          where: {
            matchRoundId: id,
          },
        })
        await tx.matchRoundResult.createMany({
          data: results.map((result) => ({
            matchRoundId: id,
            ...result,
          })),
        })
      }

      const updated = await tx.matchRound.findUnique({
        where: { id },
        include: MATCH_ROUND_INCLUDE,
      })

      if (!updated) {
        throw new NotFoundException('比赛不存在')
      }

      return serializeMatchRound(updated)
    })
  }

  async remove(id: number) {
    await this.findOne(id)
    return this.prisma.matchRound.delete({
      where: { id },
    })
  }
}

function normalizePositiveInteger(value: unknown, fallback: number) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function normalizeText(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function normalizeNullableText(value: string | null | undefined) {
  if (value === undefined) {
    return undefined
  }

  if (value === null) {
    return null
  }

  const normalized = value.trim()
  return normalized ? normalized : null
}

function normalizeCreateRoundPayload(
  dto: Pick<CreateMatchRoundDto, 'matchDate' | 'venue' | 'remark'>,
) {
  return {
    matchDate: dto.matchDate,
    venue: normalizeNullableText(dto.venue),
    remark: normalizeNullableText(dto.remark),
  }
}

function normalizeUpdateRoundPayload(
  dto: Pick<UpdateMatchRoundDto, 'matchDate' | 'venue' | 'remark'>,
) {
  return {
    ...(dto.matchDate !== undefined ? { matchDate: dto.matchDate } : {}),
    ...(dto.venue !== undefined ? { venue: normalizeNullableText(dto.venue) } : {}),
    ...(dto.remark !== undefined ? { remark: normalizeNullableText(dto.remark) } : {}),
  }
}

function buildMatchRoundWhere(params: MatchRoundListParams) {
  const matchDate = normalizeMatchDate(params.matchDate)
  const venueKeyword = normalizeText(params.venueKeyword)
  const where: Prisma.MatchRoundWhereInput = {}

  if (matchDate) {
    where.matchDate = {
      gte: matchDate,
      lt: new Date(matchDate.getTime() + 24 * 60 * 60 * 1000),
    }
  }

  if (venueKeyword) {
    where.venue = {
      contains: venueKeyword,
      mode: 'insensitive',
    }
  }

  return where
}

function normalizeMatchDate(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) {
    return undefined
  }

  const parsed = new Date(`${value.trim()}T00:00:00.000Z`)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

function normalizeResults(results: MatchRoundResultDto[]) {
  validateResults(results)

  return results.map((result) => ({
    teamId: result.teamId,
    rank: result.rank,
    points: pointsByRank(result.rank),
  }))
}

function validateResults(results: MatchRoundResultDto[]) {
  if (results.length !== 3) {
    throw new BadRequestException('比赛结果必须正好 3 条')
  }

  if (new Set(results.map((result) => result.teamId)).size !== 3) {
    throw new BadRequestException('比赛结果中的 teamId 不能重复')
  }

  const ranks = [...results.map((result) => result.rank)].sort((a, b) => a - b)

  if (ranks.join(',') !== '1,2,3') {
    throw new BadRequestException('比赛结果名次必须且只能覆盖 1、2、3')
  }
}

function pointsByRank(rank: number): 0 | 1 | 2 {
  if (rank === 1) {
    return 2
  }

  if (rank === 2) {
    return 1
  }

  return 0
}

function serializeMatchRound(round: {
  id: number
  matchDate: Date
  venue: string | null
  remark: string | null
  createdAt: Date
  updatedAt: Date
  results: Array<{
    teamId: number
    rank: number
    points: number
    team?: { name: string } | null
  }>
}) {
  assertStoredResultsInvariant(round.results)

  return {
    id: round.id,
    matchDate: round.matchDate,
    venue: round.venue,
    remark: round.remark,
    createdAt: round.createdAt,
    updatedAt: round.updatedAt,
    results: round.results.map((result) => ({
      teamId: result.teamId,
      rank: result.rank,
      points: result.points,
      teamName: result.team?.name,
    })),
  }
}

async function validateTeamResults(
  tx: {
    team: {
      count: (args: { where: { id: { in: number[] } } }) => Promise<number>
    }
  },
  results: Array<{
    teamId: number
  }>,
) {
  const teamIds = results.map((result) => result.teamId)

  if (teamIds.some((teamId) => teamId <= 0)) {
    throw new BadRequestException('比赛结果中的球队 ID 无效')
  }

  const total = await tx.team.count({
    where: {
      id: {
        in: teamIds,
      },
    },
  })

  if (total !== 3) {
    throw new BadRequestException('比赛结果中存在不存在的球队')
  }
}

function assertStoredResultsInvariant(
  results: Array<{
    rank: number
    points: number
    teamId: number
    team?: { name: string } | null
  }>,
) {
  if (results.length !== 3) {
    throw new BadRequestException('比赛结果数据异常')
  }

  const ranks = [...results.map((result) => result.rank)].sort((a, b) => a - b)

  if (ranks.join(',') !== '1,2,3') {
    throw new BadRequestException('比赛结果数据异常')
  }
}
