import { randomBytes } from 'node:crypto'
import { Injectable, NotFoundException } from '@nestjs/common'
import type { Prisma } from '@prisma/client'

import type { TeamListParams } from '@gaoge/shared-types'

import { PrismaService } from '../../common/prisma/prisma.service'

import type { CreateTeamDto } from './dto/create-team.dto'
import type { UpdateTeamDto } from './dto/update-team.dto'

@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateTeamDto) {
    return this.prisma.team.create({
      data: {
        ...normalizeTeamPayload(dto),
        code: generateTeamCode(),
      },
    })
  }

  async findAll(params: TeamListParams = {}) {
    const page = normalizePositiveInteger(params.page, 1)
    const pageSize = normalizePositiveInteger(params.pageSize, 15)
    const where = buildTeamWhere(params)
    const [list, total] = await this.prisma.$transaction([
      this.prisma.team.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }],
      }),
      this.prisma.team.count({ where }),
    ])

    return {
      list,
      total,
    }
  }

  async findOne(id: number) {
    const team = await this.prisma.team.findUnique({ where: { id } })

    if (!team) {
      throw new NotFoundException('球队不存在')
    }

    return team
  }

  async update(id: number, dto: UpdateTeamDto) {
    await this.findOne(id)
    return this.prisma.team.update({
      where: { id },
      data: normalizeTeamPayload(dto),
    })
  }

  async remove(id: number) {
    await this.findOne(id)
    return this.prisma.team.delete({ where: { id } })
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

function normalizeTeamPayload<T extends CreateTeamDto | UpdateTeamDto>(dto: T): T {
  return {
    ...dto,
    slogan: normalizeNullableText(dto.slogan),
    sponsorName: normalizeNullableText(dto.sponsorName),
  }
}

function buildTeamWhere(params: TeamListParams) {
  const keyword = normalizeText(params.keyword)
  const where: Prisma.TeamWhereInput = {}

  if (keyword) {
    where.name = {
      contains: keyword,
      mode: 'insensitive',
    } satisfies Prisma.StringFilter
  }

  return where
}

function generateTeamCode() {
  return `team_${Date.now().toString(36)}_${randomBytes(4).toString('hex')}`
}
