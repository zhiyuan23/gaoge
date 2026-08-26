import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'

import { PermissionResolverService } from '@/modules/system/rbac/permission-resolver.service'

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

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly permissionResolver: PermissionResolverService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'secret',
    })
  }

  async validate(payload: JwtPayload) {
    const authorization = await this.permissionResolver.resolve(Number(payload.sub))
    const user = authorization.user

    return {
      id: user.id,
      openid: user.openid,
      account: user.account,
      phone: user.phone,
      role: user.role,
      roles: authorization.roles,
      permissions: authorization.permissions,
      clientType: payload.clientType,
      status: user.status,
    }
  }
}
