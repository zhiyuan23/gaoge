import { Module } from '@nestjs/common'

import { FundModule } from './fund/fund.module'
import { MatchRoundModule } from './match-round/match-round.module'
import { PlayerModule } from './player/player.module'
import { TeamModule } from './team/team.module'

@Module({
  imports: [PlayerModule, TeamModule, MatchRoundModule, FundModule],
})
export class FootballModule {}
