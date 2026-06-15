import { Module } from '@nestjs/common'

import { AssetRecordModule } from './asset-record/asset-record.module'
import { FundModule } from './fund/fund.module'
import { MatchRoundModule } from './match-round/match-round.module'
import { PlayerModule } from './player/player.module'
import { StandingModule } from './standing/standing.module'
import { TeamModule } from './team/team.module'

@Module({
  imports: [
    PlayerModule,
    TeamModule,
    MatchRoundModule,
    StandingModule,
    FundModule,
    AssetRecordModule,
  ],
})
export class FootballModule {}
