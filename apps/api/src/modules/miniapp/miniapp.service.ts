import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'

import type {
  MiniappBindingSummary,
  MiniappBindOptionsResponse,
  MiniappMeResponse,
} from '@gaoge/shared-types'

import { PrismaService } from '@/common/prisma/prisma.service'

type MiniappPlayerBinding = {
  id: number
  playerNumber: number | null
  nickname: string
  avatarUrl: string | null
  subTeam: string | null
  status: string
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

@Injectable()
export class MiniappService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: number): Promise<MiniappMeResponse> {
    const user = await this.findActiveUser(userId)
    const binding = await this.findBindingByUserId(userId, this.prisma.player)

    return this.buildMeResponse(user, binding)
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

      const player = await this.findPlayerByNumber(playerNumber, tx.player)

      if (!player) {
        throw new NotFoundException('未找到对应球员')
      }

      if (player.userId !== null) {
        throw new ConflictException('该球员已被绑定')
      }

      const binding = await tx.player.update({
        where: {
          id: player.id,
        },
        data: {
          userId,
        },
        select: {
          id: true,
          playerNumber: true,
          nickname: true,
          avatarUrl: true,
          subTeam: true,
          status: true,
        },
      })

      return this.buildMeResponse(user, binding)
    })
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
      select: {
        id: true,
        playerNumber: true,
        nickname: true,
        avatarUrl: true,
        subTeam: true,
        status: true,
      },
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
        id: true,
        playerNumber: true,
        nickname: true,
        avatarUrl: true,
        subTeam: true,
        status: true,
        userId: true,
      },
    })
  }

  private buildMeResponse(
    user: MiniappUserRecord,
    binding: MiniappPlayerBinding | null,
  ): MiniappMeResponse {
    return {
      user: {
        id: user.id,
        openid: user.openid,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
        phone: user.phone,
        status: user.status as 'active' | 'inactive',
        isBound: Boolean(binding),
      },
      binding: this.buildBindingSummary(binding),
    }
  }

  private buildBindingSummary(binding: MiniappPlayerBinding | null): MiniappBindingSummary | null {
    if (!binding) {
      return null
    }

    return {
      playerId: binding.id,
      playerNumber: binding.playerNumber,
      nickname: binding.nickname,
      avatarUrl: binding.avatarUrl,
      subTeam: binding.subTeam,
      status: binding.status,
    }
  }
}
