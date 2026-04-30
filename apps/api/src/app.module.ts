import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { PrismaModule } from './common/prisma/prisma.module'
import { WechatModule } from './common/wechat/wechat.module'
import { AuthModule } from './modules/auth/auth.module'
import { BannerModule } from './modules/banner/banner.module'
import { HealthModule } from './modules/health/health.module'
import { MatchRoundsModule } from './modules/match-rounds/match-rounds.module'
import { PlayersModule } from './modules/players/players.module'
import { TeamModule } from './modules/team/team.module'
import { TeamsModule } from './modules/teams/teams.module'
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
    MatchRoundsModule,
    PlayersModule,
    AuthModule,
    TeamModule,
    TeamsModule,
    BannerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
