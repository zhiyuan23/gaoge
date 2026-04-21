import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { PrismaModule } from './common/prisma/prisma.module'
import { WechatModule } from './common/wechat/wechat.module'
import { AuthModule } from './modules/auth/auth.module'
import { BannerModule } from './modules/banner/banner.module'
import { PlayersModule } from './modules/players/players.module'
import { TeamModule } from './modules/team/team.module'
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
    PlayersModule,
    AuthModule,
    TeamModule,
    BannerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
