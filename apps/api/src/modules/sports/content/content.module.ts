import { Module } from '@nestjs/common'

import { BannerModule } from './banner/banner.module'
import { MessageBoardPostModule } from './message-board-post/message-board-post.module'

@Module({
  imports: [BannerModule, MessageBoardPostModule],
  exports: [BannerModule, MessageBoardPostModule],
})
export class ContentModule {}
