import { Module } from '@nestjs/common'

import { AuthModule as CommonAuthModule } from '@/common/auth/auth.module'
import { PrismaModule } from '@/common/prisma/prisma.module'
import { WechatModule } from '@/common/wechat/wechat.module'

import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'

@Module({
  imports: [CommonAuthModule, WechatModule, PrismaModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
