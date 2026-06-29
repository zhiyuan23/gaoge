import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'

import type {
  FootballPosition,
  MiniappBindOptionsResponse,
  MiniappMeResponse,
  MiniappPlayerSummary,
  Team,
} from '@gaoge/shared-types'

import { PrismaService } from '@/common/prisma/prisma.service'

type MiniappPlayerBinding = {
  id: number
  playerNumber: number | null
  nickname: string
  avatarUrl: string | null
  realName: string | null
  subTeam: string | null
  primaryTeamId: number | null
  primaryTeam: MiniappTeamRecord | null
  playerTeams: Array<{
    teamId: number
    team: MiniappTeamRecord
  }>
  jerseyName: string | null
  birthDate: Date | null
  isAdmin: boolean
  position: string | null
  positions: string[]
  primaryPosition: string | null
  signature: string | null
  jerseySize: string | null
  status: string
  remark: string | null
  createdAt: Date
  updatedAt: Date
}

type MiniappPlayerWriteTarget = MiniappPlayerBinding & {
  userId: number | null
}

type MiniappUserRecord = {
  id: number
  openid: string
  nickname: string | null
  avatarUrl: string | null
  phone: string | null
  status: string
}

type MiniappTeamRecord = {
  id: number
  code: string
  name: string
  avatarUrl: string | null
  slogan: string | null
  sponsorName: string | null
  sort: number
  createdAt: Date
  updatedAt: Date
}

type MiniappUserQueryResult = {
  id: number
  openid: string | null
  nickname: string | null
  avatarUrl: string | null
  phone: string | null
  status: string
  deletedAt: Date | null
}

type MiniappPlayerDelegate = PrismaService['player']

type MiniappProfileUpdatePayload = {
  avatarUrl?: string | null
  birthDate?: Date | string | null
  jerseyName?: string | null
  jerseySize?: string | null
  nickname?: string
  position?: string | null
  realName?: string | null
  remark?: string | null
  signature?: string | null
  subTeam?: string | null
}

const miniappPlayerProfileSelect = {
  id: true,
  playerNumber: true,
  nickname: true,
  avatarUrl: true,
  realName: true,
  subTeam: true,
  primaryTeamId: true,
  primaryTeam: true,
  playerTeams: {
    include: {
      team: true,
    },
  },
  jerseyName: true,
  birthDate: true,
  isAdmin: true,
  position: true,
  positions: true,
  primaryPosition: true,
  signature: true,
  jerseySize: true,
  status: true,
  remark: true,
  createdAt: true,
  updatedAt: true,
} as const

@Injectable()
export class MiniappService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: number): Promise<MiniappMeResponse> {
    const user = await this.findActiveUser(userId)
    const player = await this.findBindingByUserId(userId, this.prisma.player)

    return this.buildMeResponse(user, player)
  }

  async listBindOptions(): Promise<MiniappBindOptionsResponse> {
    const list = await this.prisma.player.findMany({
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

    return {
      list: list.map((player) => ({
        playerId: player.id,
        playerNumber: player.playerNumber,
        nickname: player.nickname,
        subTeam: player.subTeam,
      })),
    }
  }

  async bindFootballPlayer(userId: number, playerNumber: number): Promise<MiniappMeResponse> {
    const user = await this.findActiveUser(userId)

    return this.prisma.$transaction(async (tx) => {
      const currentBinding = await this.findBindingByUserId(userId, tx.player)

      if (currentBinding) {
        throw new ConflictException('当前用户已绑定球员')
      }

      const targetPlayer = await this.findPlayerByNumber(playerNumber, tx.player)

      if (!targetPlayer) {
        throw new NotFoundException('未找到对应球员')
      }

      if (targetPlayer.userId !== null) {
        throw new ConflictException('该球员已被绑定')
      }

      const player = await tx.player.update({
        where: {
          id: targetPlayer.id,
        },
        data: {
          userId,
        },
        select: miniappPlayerProfileSelect,
      })

      return this.buildMeResponse(user, player)
    })
  }

  async updateProfile(
    userId: number,
    payload: MiniappProfileUpdatePayload,
  ): Promise<MiniappMeResponse> {
    const user = await this.findActiveUser(userId)
    const boundPlayer = await this.findBindingByUserId(userId, this.prisma.player)

    if (!boundPlayer) {
      throw new NotFoundException('当前用户未绑定球员')
    }

    const data = this.buildUpdatePlayerData(payload)

    if (!Object.keys(data).length) {
      return this.buildMeResponse(user, boundPlayer)
    }

    const player = await this.prisma.player.update({
      where: {
        id: boundPlayer.id,
      },
      data,
      select: miniappPlayerProfileSelect,
    })

    return this.buildMeResponse(user, player)
  }

  private async findActiveUser(userId: number): Promise<MiniappUserRecord> {
    const user: MiniappUserQueryResult | null = await this.prisma.user.findFirst({
      where: {
        id: userId,
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

    if (!user || !user.openid || user.status !== 'active' || user.deletedAt) {
      throw new UnauthorizedException('用户不存在或已被禁用')
    }

    return {
      id: user.id,
      openid: user.openid,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
      status: user.status,
    }
  }

  private findBindingByUserId(
    userId: number,
    playerDelegate: MiniappPlayerDelegate,
  ): Promise<MiniappPlayerBinding | null> {
    return playerDelegate.findFirst({
      where: {
        userId,
      },
      select: miniappPlayerProfileSelect,
    })
  }

  private findPlayerByNumber(
    playerNumber: number,
    playerDelegate: MiniappPlayerDelegate,
  ): Promise<MiniappPlayerWriteTarget | null> {
    return playerDelegate.findFirst({
      where: {
        playerNumber,
      },
      select: {
        ...miniappPlayerProfileSelect,
        userId: true,
      },
    })
  }

  private buildMeResponse(
    user: MiniappUserRecord,
    player: MiniappPlayerBinding | null,
  ): MiniappMeResponse {
    return {
      user: {
        id: user.id,
        openid: user.openid,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
        phone: user.phone,
        status: user.status as 'active' | 'inactive',
        isBound: Boolean(player),
      },
      player: this.buildPlayerSummary(player),
    }
  }

  private buildPlayerSummary(player: MiniappPlayerBinding | null): MiniappPlayerSummary | null {
    if (!player) {
      return null
    }

    return {
      playerId: player.id,
      playerNumber: player.playerNumber,
      nickname: player.nickname,
      avatarUrl: player.avatarUrl,
      realName: player.realName,
      subTeam: player.subTeam,
      teamIds: player.playerTeams.map((item) => item.teamId),
      teams: player.playerTeams.map((item) => serializeTeam(item.team)),
      primaryTeamId: player.primaryTeamId,
      primaryTeam: player.primaryTeam ? serializeTeam(player.primaryTeam) : null,
      jerseyName: player.jerseyName,
      birthDate: player.birthDate?.toISOString() ?? null,
      isAdmin: player.isAdmin,
      position: player.position,
      positions: player.positions as FootballPosition[],
      primaryPosition: player.primaryPosition as FootballPosition | null,
      signature: player.signature,
      jerseySize: player.jerseySize,
      status: player.status,
      remark: player.remark,
      createdAt: player.createdAt.toISOString(),
      updatedAt: player.updatedAt.toISOString(),
    }
  }

  private buildUpdatePlayerData(payload: MiniappProfileUpdatePayload) {
    const data: {
      avatarUrl?: string | null
      birthDate?: Date | null
      jerseyName?: string | null
      jerseySize?: string | null
      nickname?: string
      position?: string | null
      realName?: string | null
      remark?: string | null
      signature?: string | null
      subTeam?: string | null
    } = {}

    if (payload.nickname !== undefined) {
      data.nickname = normalizeRequiredText(payload.nickname, '昵称不能为空')
    }

    if (payload.avatarUrl !== undefined) {
      data.avatarUrl = normalizeNullableText(payload.avatarUrl)
    }

    if (payload.realName !== undefined) {
      data.realName = normalizeNullableText(payload.realName)
    }

    if (payload.subTeam !== undefined) {
      data.subTeam = normalizeNullableText(payload.subTeam)
    }

    if (payload.jerseyName !== undefined) {
      data.jerseyName = normalizeNullableText(payload.jerseyName)
    }

    if (payload.birthDate !== undefined) {
      data.birthDate = normalizeNullableDate(payload.birthDate)
    }

    if (payload.position !== undefined) {
      data.position = normalizeNullableText(payload.position)
    }

    if (payload.jerseySize !== undefined) {
      data.jerseySize = normalizeNullableText(payload.jerseySize)
    }

    if (payload.remark !== undefined) {
      data.remark = normalizeNullableText(payload.remark)
    }

    if (payload.signature !== undefined) {
      data.signature = normalizeSignature(payload.signature)
    }

    return data
  }
}

function normalizeNullableText(value: string | null | undefined) {
  if (value == null) {
    return null
  }

  const normalized = value.trim()

  return normalized ? normalized : null
}

function normalizeRequiredText(value: unknown, message: string) {
  const normalized = normalizeNullableText(typeof value === 'string' ? value : null)

  if (!normalized) {
    throw new BadRequestException(message)
  }

  return normalized
}

function normalizeNullableDate(value: Date | string | null | undefined) {
  if (value == null) {
    return null
  }

  const date = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException('出生日期格式不正确')
  }

  return date
}

function normalizeSignature(value: string | null | undefined) {
  const normalized = normalizeNullableText(value)

  if (normalized && normalized.length > 15) {
    throw new BadRequestException('签名最多 15 个字')
  }

  return normalized
}

function serializeTeam(team: MiniappTeamRecord): Team {
  return {
    ...team,
    code: team.code as Team['code'],
    createdAt: team.createdAt.toISOString(),
    updatedAt: team.updatedAt.toISOString(),
  }
}
