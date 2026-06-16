import { Module } from '@nestjs/common'

import { RumorPostController } from './rumor-post.controller'
import { RumorPostService } from './rumor-post.service'

@Module({
  controllers: [RumorPostController],
  providers: [RumorPostService],
  exports: [RumorPostService],
})
export class RumorPostModule {}
