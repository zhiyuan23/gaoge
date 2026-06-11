import { Controller, Get, Query } from '@nestjs/common'

import { MessageBoardPostListDto } from '@/modules/content/message-board-post/dto/message-board-post-list.dto'
import { MessageBoardPostService } from '@/modules/content/message-board-post/message-board-post.service'

@Controller('miniapp')
export class MiniappPublicController {
  constructor(private readonly messageBoardPostService: MessageBoardPostService) {}

  @Get('message-board-posts')
  listMessageBoardPosts(@Query() query: MessageBoardPostListDto) {
    return this.messageBoardPostService.findPublishedForMiniapp(query)
  }
}
