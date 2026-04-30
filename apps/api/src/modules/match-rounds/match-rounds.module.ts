import { Module } from '@nestjs/common'

import { PrismaModule } from '../../common/prisma/prisma.module'

import { MatchRoundsController } from './match-rounds.controller'
import { MatchRoundsService } from './match-rounds.service'

@Module({
  imports: [PrismaModule],
  controllers: [MatchRoundsController],
  providers: [MatchRoundsService],
  exports: [MatchRoundsService],
})
export class MatchRoundsModule {}
