import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import type { Prisma } from '@prisma/client'

import type { FootballPosition, PlayerListParams } from '@gaoge/shared-types'

import { PrismaService } from '@/common/prisma/prisma.service'

import type { CreatePlayerDto } from './dto/create-player.dto'
import type { UpdatePlayerDto } from './dto/update-player.dto'

@Injectable()
export class PlayerService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePlayerDto) {
    const normalized = await this.normalizePlayerWritePayload(dto, {
      requireTeams: true,
      requirePositions: true,
    })

    return this.prisma.$transaction(async (tx) => {
      const player = await tx.player.create({
        data: normalized.data as Prisma.PlayerUncheckedCreateInput,
      })
      await this.rebuildPlayerTeams(tx, player.id, normalized.teamIds)
      const created = await this.findPlayerWithRelations(player.id, tx)

      return serializePlayer(created)
    })
  }

  async findAll(params: PlayerListParams = {}) {
    const page = normalizePositiveInteger(params.page, 1)
    const pageSize = normalizePositiveInteger(params.pageSize, 15)
    const where = buildPlayerWhere(params)
    const [list, total] = await this.prisma.$transaction([
      this.prisma.player.findMany({
        where,
        include: playerInclude,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { playerNumber: 'asc' },
      }),
      this.prisma.player.count({ where }),
    ])

    return {
      list: list.map(serializePlayer),
      total,
    }
  }

  async findOne(id: number) {
    return serializePlayer(await this.findPlayerWithRelations(id, this.prisma))
  }

  async update(id: number, dto: UpdatePlayerDto) {
    const current = await this.findPlayerWithRelations(id, this.prisma)
    const normalized = await this.normalizePlayerWritePayload(dto, {
      current,
      requireTeams: false,
      requirePositions: false,
    })

    return this.prisma.$transaction(async (tx) => {
      await tx.player.update({
        where: { id },
        data: normalized.data as Prisma.PlayerUncheckedUpdateInput,
      })

      if (normalized.shouldRebuildTeams) {
        await this.rebuildPlayerTeams(tx, id, normalized.teamIds)
      }

      const updated = await this.findPlayerWithRelations(id, tx)

      return serializePlayer(updated)
    })
  }

  async remove(id: number) {
    await this.findOne(id)
    return this.prisma.player.delete({ where: { id } })
  }

  private async findPlayerWithRelations(
    id: number,
    tx: Pick<PrismaService, 'player'>,
  ): Promise<PlayerWithRelations> {
    const player = await tx.player.findUnique({
      where: { id },
      include: playerInclude,
    })

    if (!player) {
      throw new NotFoundException('球员不存在')
    }

    return player
  }

  private async normalizePlayerWritePayload(
    dto: CreatePlayerDto | UpdatePlayerDto,
    options: {
      current?: PlayerWithRelations
      requireTeams: boolean
      requirePositions: boolean
    },
  ) {
    const {
      primaryPosition: rawPrimaryPosition,
      primaryTeamId: rawPrimaryTeamId,
      positions: rawPositions,
      signature: rawSignature,
      teamIds: rawTeamIds,
      ...baseDto
    } = dto
    const shouldRebuildTeams = Array.isArray(rawTeamIds)
    const teamIds = shouldRebuildTeams
      ? normalizeIntegerList(rawTeamIds)
      : getCurrentTeamIds(options.current)
    const positions = Array.isArray(rawPositions)
      ? normalizePositionList(rawPositions)
      : (options.current?.positions as FootballPosition[] | undefined)
    const hasPrimaryTeamId = hasOwn(dto, 'primaryTeamId')
    const primaryTeamId = hasPrimaryTeamId
      ? normalizeNullableInteger(rawPrimaryTeamId)
      : options.current?.primaryTeamId
    const hasPrimaryPosition = hasOwn(dto, 'primaryPosition')
    const primaryPosition = hasPrimaryPosition
      ? normalizeNullablePosition(rawPrimaryPosition)
      : (options.current?.primaryPosition as FootballPosition | null | undefined)
    const shouldWritePositions =
      Array.isArray(rawPositions) || hasPrimaryPosition || options.requirePositions
    const shouldWriteTeams = shouldRebuildTeams || hasPrimaryTeamId || options.requireTeams

    if (options.requireTeams && !teamIds.length) {
      throw new BadRequestException('请选择代表球队')
    }

    if (
      shouldWriteTeams &&
      primaryTeamId !== null &&
      primaryTeamId !== undefined &&
      !teamIds.includes(primaryTeamId)
    ) {
      throw new BadRequestException('主队必须包含在代表球队中')
    }

    if (options.requirePositions && !positions?.length) {
      throw new BadRequestException('请选择可踢位置')
    }

    if (
      shouldWritePositions &&
      primaryPosition !== null &&
      primaryPosition !== undefined &&
      !positions?.includes(primaryPosition)
    ) {
      throw new BadRequestException('主位置必须包含在可踢位置中')
    }

    const teams = shouldWriteTeams ? await this.findTeamsByIds(teamIds) : undefined
    const data: Prisma.PlayerUncheckedCreateInput | Prisma.PlayerUncheckedUpdateInput = {
      ...baseDto,
    }

    if (shouldWriteTeams) {
      data.primaryTeamId = primaryTeamId ?? null
      data.subTeam = teams?.map((team) => team.name).join('、') || null
    }

    if (shouldWritePositions) {
      const nextPositions = positions ?? []
      data.positions = nextPositions
      data.primaryPosition =
        primaryPosition && nextPositions.includes(primaryPosition) ? primaryPosition : null
      data.position = formatPositionText(
        nextPositions,
        data.primaryPosition as FootballPosition | null,
      )
    }

    if (hasOwn(dto, 'signature')) {
      data.signature = normalizeSignature(rawSignature)
    }

    return {
      data,
      shouldRebuildTeams,
      teamIds,
    }
  }

  private async findTeamsByIds(teamIds: number[]) {
    const teams = await this.prisma.team.findMany({
      where: {
        id: {
          in: teamIds,
        },
      },
      orderBy: [{ sort: 'asc' }, { id: 'asc' }],
    })

    if (teams.length !== teamIds.length) {
      throw new BadRequestException('代表球队不存在')
    }

    return teams
  }

  private async rebuildPlayerTeams(
    tx: Pick<PrismaService, 'playerTeam'>,
    playerId: number,
    teamIds: number[],
  ) {
    await tx.playerTeam.deleteMany({
      where: {
        playerId,
      },
    })

    if (!teamIds.length) {
      return
    }

    await tx.playerTeam.createMany({
      data: teamIds.map((teamId) => ({
        playerId,
        teamId,
      })),
    })
  }
}

const playerInclude = {
  primaryTeam: true,
  playerTeams: {
    include: {
      team: true,
    },
    orderBy: [{ team: { sort: 'asc' } }, { teamId: 'asc' }],
  },
} satisfies Prisma.PlayerInclude

type PlayerWithRelations = Prisma.PlayerGetPayload<{
  include: typeof playerInclude
}>

function normalizePositiveInteger(value: unknown, fallback: number) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function normalizeText(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function normalizeKeywordNumber(value: unknown) {
  if (typeof value === 'number') {
    return Number.isInteger(value) ? value : undefined
  }

  if (typeof value !== 'string' || !/^\d+$/.test(value.trim())) {
    return undefined
  }

  const parsed = Number(value.trim())
  return Number.isInteger(parsed) ? parsed : undefined
}

function normalizeIntegerList(values: number[] | undefined) {
  if (!Array.isArray(values)) {
    return []
  }

  return Array.from(
    new Set(
      values.map((value) => Number(value)).filter((value) => Number.isInteger(value) && value > 0),
    ),
  )
}

function normalizeNullableInteger(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new BadRequestException('主队不存在')
  }

  return parsed
}

function normalizePositionList(values: FootballPosition[] | undefined) {
  if (!Array.isArray(values)) {
    return []
  }

  const normalized = Array.from(new Set(values))
  const invalidPosition = normalized.find((value) => !isFootballPosition(value))

  if (invalidPosition) {
    throw new BadRequestException('位置不正确')
  }

  return normalized
}

function normalizeNullablePosition(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return null
  }

  if (!isFootballPosition(value)) {
    throw new BadRequestException('主位置不正确')
  }

  return value
}

function normalizeSignature(value: unknown) {
  if (value === null || value === undefined) {
    return null
  }

  const normalized = String(value).trim()

  if (!normalized) {
    return null
  }

  if (normalized.length > 15) {
    throw new BadRequestException('签名最多 15 个字')
  }

  return normalized
}

function hasOwn<T extends object>(target: T, key: PropertyKey) {
  return Object.prototype.hasOwnProperty.call(target, key)
}

function getCurrentTeamIds(current: PlayerWithRelations | undefined) {
  return current?.playerTeams.map((item) => item.teamId) ?? []
}

function isFootballPosition(value: unknown): value is FootballPosition {
  return footballPositionSet.has(value as FootballPosition)
}

function formatPositionText(
  positions: FootballPosition[],
  primaryPosition: FootballPosition | null | undefined,
) {
  if (primaryPosition) {
    return footballPositionLabelMap.get(primaryPosition) ?? primaryPosition
  }

  const text = positions
    .map((position) => footballPositionLabelMap.get(position) ?? position)
    .join('、')

  return text || null
}

function serializePlayer(player: PlayerWithRelations) {
  const { playerTeams, ...rest } = player
  const teams = playerTeams.map((item) => item.team)

  return {
    ...rest,
    teamIds: teams.map((team) => team.id),
    teams,
  }
}

const footballPositionOptions: Array<{
  label: string
  value: FootballPosition
}> = [
  { label: '门将', value: 'goalkeeper' },
  { label: '中后卫', value: 'center_back' },
  { label: '左后卫', value: 'left_back' },
  { label: '右后卫', value: 'right_back' },
  { label: '后腰', value: 'defensive_midfielder' },
  { label: '中前卫', value: 'central_midfielder' },
  { label: '前腰', value: 'attacking_midfielder' },
  { label: '左边锋', value: 'left_winger' },
  { label: '右边锋', value: 'right_winger' },
  { label: '中锋', value: 'striker' },
  { label: '前锋', value: 'forward' },
]
const footballPositionSet = new Set(footballPositionOptions.map((item) => item.value))
const footballPositionLabelMap = new Map(
  footballPositionOptions.map((item) => [item.value, item.label] as const),
)

// 列表筛选条件集中构造，便于后续继续扩展更多查询字段。
function buildPlayerWhere(params: PlayerListParams) {
  const keyword = normalizeText(params.keyword)
  const subTeam = normalizeText(params.subTeam)
  const teamId = normalizeKeywordNumber(params.teamId)
  const primaryTeamId = normalizePrimaryTeamFilter(params.primaryTeamId)
  const position = normalizePositionFilter(params.position)
  const primaryPosition = normalizePositionFilter(params.primaryPosition)
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
  if (typeof teamId === 'number') {
    where.playerTeams = {
      some: {
        teamId,
      },
    }
  }
  if (primaryTeamId !== undefined) {
    where.primaryTeamId = primaryTeamId
  }
  if (position) {
    where.positions = {
      has: position,
    }
  }
  if (primaryPosition) {
    where.primaryPosition = primaryPosition
  }

  return where
}

function normalizePrimaryTeamFilter(value: PlayerListParams['primaryTeamId']) {
  if (value === 'none') {
    return null
  }

  if (value === undefined || value === null || value === '') {
    return undefined
  }

  return normalizeKeywordNumber(String(value))
}

function normalizePositionFilter(value: unknown) {
  return isFootballPosition(value) ? value : undefined
}
