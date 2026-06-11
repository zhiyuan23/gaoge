import { Module } from '@nestjs/common'

import { MessageBoardPostModule } from './message-board-post/message-board-post.module'

@Module({
  imports: [MessageBoardPostModule],
  exports: [MessageBoardPostModule],
})
export class ContentModule {}
