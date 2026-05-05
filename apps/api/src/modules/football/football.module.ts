import { Module } from '@nestjs/common'

import { FundModule } from './fund/fund.module'
import { MatchRoundsModule } from './match-rounds/match-rounds.module'
import { PlayersModule } from './players/players.module'
import { TeamsModule } from './teams/teams.module'

@Module({
  imports: [PlayersModule, TeamsModule, MatchRoundsModule, FundModule],
})
export class FootballModule {}
