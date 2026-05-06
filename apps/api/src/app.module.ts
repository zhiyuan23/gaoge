import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { PrismaModule } from './common/prisma/prisma.module'
import { WechatModule } from './common/wechat/wechat.module'
import { AuthModule } from './modules/auth/auth.module'
import { BannerModule } from './modules/banner/banner.module'
import { FootballModule } from './modules/football/football.module'
import { HealthModule } from './modules/health/health.module'
import { SystemModule } from './modules/system/system.module'
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
    HealthModule,
    FootballModule,
    AuthModule,
    BannerModule,
    SystemModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
