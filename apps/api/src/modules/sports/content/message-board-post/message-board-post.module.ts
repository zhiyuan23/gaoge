import { Module } from '@nestjs/common'

import { MessageBoardPostController } from './message-board-post.controller'
import { MessageBoardPostService } from './message-board-post.service'

@Module({
  controllers: [MessageBoardPostController],
  providers: [MessageBoardPostService],
  exports: [MessageBoardPostService],
})
export class MessageBoardPostModule {}
