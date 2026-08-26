import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { Reflector } from '@nestjs/core'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'

import { RbacModule } from '@/modules/system/rbac/rbac.module'

import { PrismaModule } from '../prisma/prisma.module'
import { WechatModule } from '../wechat/wechat.module'

import { JwtStrategy } from './jwt.strategy'
import { PermissionsGuard } from './permissions.guard'
import { RolesGuard } from './roles.guard'

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN', '2h'),
        },
      }),
    }),
    PrismaModule,
    WechatModule,
    RbacModule,
  ],
  providers: [JwtStrategy, Reflector, RolesGuard, PermissionsGuard],
  exports: [JwtModule, PassportModule, RolesGuard, PermissionsGuard],
})
export class AuthModule {}
