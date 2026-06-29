import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { PrismaModule } from './common/prisma/prisma.module'
import { WechatModule } from './common/wechat/wechat.module'
import { AuthModule } from './modules/auth/auth.module'
import { HealthModule } from './modules/health/health.module'
import { MiniappModule } from './modules/miniapp/miniapp.module'
import { SportsModule } from './modules/sports/sports.module'
import { SystemModule } from './modules/system/system.module'
import { WechatShareModule } from './modules/wechat-share/wechat-share.module'
import { AppController } from './app.controller'
import { AppService } from './app.service'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule,
    WechatModule,
    WechatShareModule,
    HealthModule,
    SportsModule,
    AuthModule,
    MiniappModule,
    SystemModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
