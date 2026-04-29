import { Injectable, NotFoundException } from '@nestjs/common'
import type { Prisma } from '@prisma/client'

import type { PlayerListParams } from '@gaoge/shared-types'

import { PrismaService } from '../../common/prisma/prisma.service'

import type { CreatePlayerDto } from './dto/create-player.dto'
import type { UpdatePlayerDto } from './dto/update-player.dto'

@Injectable()
export class PlayersService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreatePlayerDto) {
    return this.prisma.player.create({ data: dto })
  }

  async findAll(params: PlayerListParams = {}) {
    const page = normalizePositiveInteger(params.page, 1)
    const pageSize = normalizePositiveInteger(params.pageSize, 15)
    const where = buildPlayerWhere(params)
    const [list, total] = await this.prisma.$transaction([
      this.prisma.player.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { playerNumber: 'asc' },
      }),
      this.prisma.player.count({ where }),
    ])

    return {
      list,
      total,
    }
  }

  async findOne(id: number) {
    const player = await this.prisma.player.findUnique({ where: { id } })
    if (!player) {
      throw new NotFoundException('球员不存在')
    }
    return player
  }

  async update(id: number, dto: UpdatePlayerDto) {
    await this.findOne(id)
    return this.prisma.player.update({ where: { id }, data: dto })
  }

  async remove(id: number) {
    await this.findOne(id)
    return this.prisma.player.delete({ where: { id } })
  }
}

function normalizePositiveInteger(value: unknown, fallback: number) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function normalizeText(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function normalizeKeywordNumber(value: unknown) {
  if (typeof value !== 'string' || !/^\d+$/.test(value.trim())) {
    return undefined
  }

  const parsed = Number(value.trim())
  return Number.isInteger(parsed) ? parsed : undefined
}

// 列表筛选条件集中构造，便于后续继续扩展更多查询字段。
function buildPlayerWhere(params: PlayerListParams) {
  const keyword = normalizeText(params.keyword)
  const subTeam = normalizeText(params.subTeam)
  const where: Prisma.PlayerWhereInput = {}

  if (keyword) {
    const nicknameCondition = {
      contains: keyword,
      mode: 'insensitive',
    } satisfies Prisma.StringFilter
    const playerNumber = normalizeKeywordNumber(keyword)

    where.OR = [{ nickname: nicknameCondition }]

    if (typeof playerNumber === 'number') {
      where.OR.push({ playerNumber })
    }
  }
  if (subTeam) {
    where.subTeam = subTeam
  }

  return where
}
