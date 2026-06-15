import { Controller, Get, Query } from '@nestjs/common'

import type { FootballStandingParams } from '@gaoge/shared-types'

import { StandingService } from './standing.service'

@Controller('football/standings')
export class StandingController {
  constructor(private readonly standingService: StandingService) {}

  @Get()
  findSeasonStanding(@Query() query: FootballStandingParams) {
    return this.standingService.findSeasonStanding(query)
  }
}
