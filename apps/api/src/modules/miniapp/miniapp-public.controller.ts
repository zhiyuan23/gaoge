import { Controller, Get, Query } from '@nestjs/common'

import { RumorPostListDto } from '@/modules/sports/content/rumor-post/dto/rumor-post-list.dto'
import { RumorPostService } from '@/modules/sports/content/rumor-post/rumor-post.service'

@Controller('miniapp')
export class MiniappPublicController {
  constructor(private readonly rumorPostService: RumorPostService) {}

  @Get('rumor-posts')
  listRumorPosts(@Query() query: RumorPostListDto) {
    return this.rumorPostService.findPublishedForMiniapp(query)
  }
}
