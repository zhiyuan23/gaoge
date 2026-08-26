import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'

import type {
  AuthLoginResponse,
  AuthRoleSummary,
  AuthUser,
  FootballPosition,
  MiniappAuthUser,
  MiniappLoginResponse,
  MiniappPlayerSummary,
  PermissionResponse,
  Team,
  UserRole,
} from '@gaoge/shared-types'

import { hashPassword, verifyPassword } from '@/common/auth/password.util'
import { PrismaService } from '@/common/prisma/prisma.service'
import { deletePreviousAdminAvatarUrls } from '@/common/storage/admin-avatar-storage'
import { WechatService } from '@/common/wechat/wechat.service'
import { PermissionResolverService } from '@/modules/system/rbac/permission-resolver.service'

import type { ChangePasswordDto } from './dto/change-password.dto'
import type { AdminLoginDto, MiniappLoginDto, PhoneLoginDto } from './dto/login.dto'
import type { UpdateProfileDto } from './dto/update-profile.dto'

export interface JwtPayload {
  sub: number
  openid?: string | null
  account?: string | null
  phone?: string
  role?: UserRole
  clientType?: 'admin' | 'miniapp'
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    private readonly wechatService: WechatService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly permissionResolver: PermissionResolverService,
  ) {}

  hashAdminPassword = (password: string) => hashPassword(password)

  async adminLogin(loginDto: AdminLoginDto): Promise<AuthLoginResponse> {
    const user = await this.prisma.user.findFirst({
      where: {
        account: loginDto.account,
      },
    })

    if (!user?.passwordHash) {
      throw new UnauthorizedException('账号或密码错误')
    }

    if (user.deletedAt || user.status !== 'active' || !user.account) {
      throw new UnauthorizedException('当前账号无后台权限')
    }

    const isPasswordValid = await verifyPassword(loginDto.password, user.passwordHash)
    if (!isPasswordValid) {
      throw new UnauthorizedException('账号或密码错误')
    }

    const authorization = await this.permissionResolver.resolve(user.id)
    if (authorization.roles.length === 0) {
      throw new UnauthorizedException('当前账号无后台权限')
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
      },
    })

    const tokens = await this.generateTokens(updatedUser)

    return {
      user: this.serializeUser(updatedUser),
      ...tokens,
    }
  }

  /**
   * 微信登录
   */
  async wechatLogin(loginDto: MiniappLoginDto): Promise<MiniappLoginResponse> {
    try {
      // 1. 通过code获取openid和session_key
      const wechatSession = await this.wechatService.getSessionByCode(loginDto.code)

      // 2. 查找或创建用户
      let user = await this.prisma.user.findUnique({
        where: { openid: wechatSession.openid },
      })

      if (!user) {
        // 新用户注册
        user = await this.prisma.user.create({
          data: {
            openid: wechatSession.openid,
            unionid: wechatSession.unionid,
            lastLoginAt: new Date(),
          },
        })
      } else {
        // 更新最后登录时间
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            lastLoginAt: new Date(),
          },
        })
      }

      const player = await this.prisma.player.findFirst({
        where: { userId: user.id },
        select: {
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
        },
      })

      // 3. 生成token
      const tokens = await this.generateTokens(user)

      this.logger.log('微信登录成功', { userId: user.id, openid: user.openid })

      return {
        ...tokens,
        user: this.serializeMiniappUser(user, Boolean(player)),
        player: this.serializeMiniappPlayer(player),
      }
    } catch (error: any) {
      this.logger.error('微信登录失败', { error: error.message, code: loginDto.code })
      throw new UnauthorizedException('微信登录失败')
    }
  }

  /**
   * 手机号登录
   */
  async phoneLogin(loginDto: PhoneLoginDto): Promise<AuthLoginResponse> {
    try {
      // 1. 通过code获取session_key
      const wechatSession = await this.wechatService.getSessionByCode(loginDto.code)

      // 2. 解密手机号
      const phoneInfo = this.wechatService.decryptPhoneInfo(
        loginDto.encryptedData,
        wechatSession.session_key,
        loginDto.iv,
      )

      // 3. 查找或创建用户
      let user = await this.prisma.user.findUnique({
        where: { openid: wechatSession.openid },
      })

      if (!user) {
        // 新用户注册
        user = await this.prisma.user.create({
          data: {
            openid: wechatSession.openid,
            unionid: wechatSession.unionid,
            phone: phoneInfo.phoneNumber,
            lastLoginAt: new Date(),
          },
        })
      } else {
        // 更新用户信息
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            phone: phoneInfo.phoneNumber,
            lastLoginAt: new Date(),
          },
        })
      }

      // 4. 生成token
      const tokens = await this.generateTokens(user)

      this.logger.log('手机号登录成功', { userId: user.id, phone: phoneInfo.phoneNumber })

      return {
        user: this.serializeUser(user),
        ...tokens,
      }
    } catch (error: any) {
      this.logger.error('手机号登录失败', { error: error.message, code: loginDto.code })
      throw new BadRequestException('手机号登录失败')
    }
  }

  /**
   * 生成 JWT token
   */
  private async generateTokens(user: any): Promise<{
    accessToken: string
    refreshToken: string
    expiresIn: number
  }> {
    const clientType = user.account ? 'admin' : 'miniapp'
    const payload: JwtPayload = {
      sub: user.id,
      openid: user.openid,
      account: user.account,
      phone: user.phone,
      role: user.role,
      clientType,
    }

    const accessToken = await this.jwtService.signAsync(payload)
    const refreshToken = await this.jwtService.signAsync({ sub: user.id }, { expiresIn: '7d' })

    // 存储 refresh token
    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天
      },
    })

    return {
      accessToken,
      refreshToken,
      expiresIn: 2 * 60 * 60, // 2小时
    }
  }

  /**
   * 刷新token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      // 1. 验证refresh token是否有效
      const tokenRecord = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      })

      if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
        throw new UnauthorizedException('刷新token无效或已过期')
      }

      // 2. 验证 JWT 是否有效
      try {
        await this.jwtService.verifyAsync(refreshToken)
      } catch {
        throw new UnauthorizedException('刷新token验证失败')
      }

      // 3. 获取用户信息
      const user = tokenRecord.user

      if (user.deletedAt) {
        throw new UnauthorizedException('用户已被删除')
      }

      // 4. 生成新的token
      const newTokens = await this.generateTokens(user)

      // 5. 删除旧的refresh token
      await this.prisma.refreshToken.delete({
        where: { id: tokenRecord.id },
      })

      return {
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
      }
    } catch (error: any) {
      this.logger.error('刷新token失败', { error: error.message })
      throw new UnauthorizedException('刷新token失败')
    }
  }

  /**
   * 退出登录
   */
  async logout(userId: number): Promise<{ message: string }> {
    try {
      // 1. 删除用户的所有refresh token
      await this.prisma.refreshToken.deleteMany({
        where: { userId },
      })

      this.logger.log('用户退出成功', { userId })

      return { message: '退出成功' }
    } catch (error: any) {
      this.logger.error('退出失败', { userId, error: error.message })
      throw new BadRequestException('退出失败')
    }
  }

  /**
   * 验证用户
   */
  async validateUser(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: Number(payload.sub) },
    })

    // 检查用户是否已删除
    if (!user || user.deletedAt) {
      return null
    }

    return user
  }

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user || user.deletedAt || user.status !== 'active') {
      throw new UnauthorizedException('用户不存在或已被禁用')
    }

    return this.serializeUser(user)
  }

  async updateProfile(userId: number, dto: UpdateProfileDto): Promise<AuthUser> {
    const previousUser = await this.prisma.user.findUnique({
      where: { id: userId },
    })
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        nickname: dto.nickname.trim(),
        avatarUrl: dto.avatarUrl?.trim() || null,
      },
    })

    await deletePreviousAdminAvatarUrls({
      nextAvatarUrl: updatedUser.avatarUrl,
      previousAvatarUrls: [previousUser?.avatarUrl],
      userId,
    })

    return this.serializeUser(updatedUser)
  }

  async updateProfileAvatar(userId: number, avatarUrl: string): Promise<AuthUser> {
    const previousUser = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!previousUser || previousUser.deletedAt || previousUser.status !== 'active') {
      throw new UnauthorizedException('用户不存在或已被禁用')
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        avatarUrl,
      },
    })

    await deletePreviousAdminAvatarUrls({
      nextAvatarUrl: updatedUser.avatarUrl,
      previousAvatarUrls: [previousUser.avatarUrl],
      userId,
    })

    return this.serializeUser(updatedUser)
  }

  async changePassword(userId: number, dto: ChangePasswordDto): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user || user.deletedAt || user.status !== 'active' || !user.passwordHash) {
      throw new UnauthorizedException('用户不存在或已被禁用')
    }

    if (!(await verifyPassword(dto.currentPassword, user.passwordHash))) {
      throw new BadRequestException('原密码不正确')
    }

    if (await verifyPassword(dto.newPassword, user.passwordHash)) {
      throw new BadRequestException('新密码不能与原密码相同')
    }

    const passwordHash = await hashPassword(dto.newPassword)
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          passwordHash,
        },
      })
      await tx.refreshToken.deleteMany({ where: { userId } })
    })

    return { message: '密码修改成功，请重新登录' }
  }

  async getPermission(userId: number): Promise<PermissionResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user || user.deletedAt || user.status !== 'active') {
      throw new UnauthorizedException('用户不存在或已被禁用')
    }

    const authorization = await this.permissionResolver.resolve(user.id)

    return {
      permissions: authorization.permissions,
      role: this.toEffectiveUserRole(user, authorization.roles),
      roles: authorization.roles,
    }
  }

  private serializeUser(user: any): AuthUser {
    return {
      id: user.id,
      account: user.account ?? '',
      openid: user.openid,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
      role: this.toUserRole(user.role),
      status: user.status,
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    }
  }

  private serializeMiniappUser(user: any, isBound: boolean): MiniappAuthUser {
    return {
      id: user.id,
      openid: user.openid ?? '',
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
      status: user.status,
      isBound,
    }
  }

  private serializeMiniappPlayer(
    player: {
      id: number
      playerNumber: number | null
      nickname: string
      avatarUrl: string | null
      realName: string | null
      subTeam: string | null
      primaryTeamId: number | null
      primaryTeam: AuthTeamRecord | null
      playerTeams: Array<{
        teamId: number
        team: AuthTeamRecord
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
    } | null,
  ): MiniappPlayerSummary | null {
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

  private toUserRole(role: string): UserRole {
    if (role === 'admin') return 'admin'
    if (role === 'viewer') return 'viewer'
    return 'user'
  }

  private toEffectiveUserRole(
    user: { role: string; account?: string | null },
    roles: AuthRoleSummary[],
  ) {
    if (roles.length > 0 && user.account) {
      if (roles.length === 1 && roles[0]?.code === 'system_viewer') {
        return 'viewer'
      }

      return 'admin'
    }

    return this.toUserRole(user.role)
  }
}

type AuthTeamRecord = {
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

function serializeTeam(team: AuthTeamRecord): Team {
  return {
    ...team,
    code: team.code as Team['code'],
    createdAt: team.createdAt.toISOString(),
    updatedAt: team.updatedAt.toISOString(),
  }
}
