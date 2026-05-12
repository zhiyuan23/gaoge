import { Module } from '@nestjs/common'

import { AssetRecordModule } from './asset-record/asset-record.module'
import { FundModule } from './fund/fund.module'
import { MatchRoundModule } from './match-round/match-round.module'
import { PlayerModule } from './player/player.module'
import { TeamModule } from './team/team.module'

@Module({
  imports: [PlayerModule, TeamModule, MatchRoundModule, FundModule, AssetRecordModule],
})
export class BasketballModule {}
