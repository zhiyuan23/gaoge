import { Module } from '@nestjs/common'

import { MatchRoundController } from './match-round.controller'
import { MatchRoundService } from './match-round.service'

@Module({
  controllers: [MatchRoundController],
  providers: [MatchRoundService],
  exports: [MatchRoundService],
})
export class MatchRoundModule {}
