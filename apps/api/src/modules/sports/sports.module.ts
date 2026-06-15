import { Module } from '@nestjs/common'

import { ContentModule } from './content/content.module'
import { FootballModule } from './football/football.module'

@Module({
  imports: [FootballModule, ContentModule],
  exports: [FootballModule, ContentModule],
})
export class SportsModule {}
