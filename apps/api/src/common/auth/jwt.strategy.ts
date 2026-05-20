import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'

import { PrismaService } from '../prisma/prisma.service'

export interface JwtPayload {
  sub: number
  openid?: string | null
  account?: string | null
  phone?: string | null
  role?: string
  clientType?: 'admin' | 'miniapp'
  iat: number
  exp: number
}

interface JwtRequestUserRole {
  id: number
  code: string
  name: string
  status: string
  rolePermissions: {
    permission: {
      code: string
      status: string
    }
  }[]
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'secret',
    })
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: Number(payload.sub) },
      include: {
        userRoles: {
          where: {
            role: {
              status: 'active',
            },
          },
          select: {
            role: {
              select: {
                id: true,
                code: true,
                name: true,
                status: true,
                rolePermissions: {
                  where: {
                    permission: {
                      status: 'active',
                    },
                  },
                  select: {
                    permission: {
                      select: {
                        code: true,
                        status: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!user || user.deletedAt || user.status !== 'active') {
      throw new UnauthorizedException('用户不存在或已被禁用')
    }

    const roles = user.userRoles
      .map((item) => item.role)
      .filter((role) => role.status === 'active') as JwtRequestUserRole[]
    const permissions = [
      ...new Set(roles.flatMap((role) => role.rolePermissions.map((item) => item.permission.code))),
    ]

    return {
      id: user.id,
      openid: user.openid,
      account: user.account,
      phone: user.phone,
      role: user.role,
      roles: roles.map((role) => ({
        id: role.id,
        code: role.code,
        name: role.name,
        status: role.status,
      })),
      permissions,
      clientType: payload.clientType,
      status: user.status,
    }
  }
}
