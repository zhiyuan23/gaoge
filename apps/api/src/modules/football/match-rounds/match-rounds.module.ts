import { Module } from '@nestjs/common'

import { MatchRoundsController } from './match-rounds.controller'
import { MatchRoundsService } from './match-rounds.service'

@Module({
  controllers: [MatchRoundsController],
  providers: [MatchRoundsService],
  exports: [MatchRoundsService],
})
export class MatchRoundsModule {}
