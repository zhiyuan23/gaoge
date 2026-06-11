import { Module } from '@nestjs/common'

import { MessageBoardPostModule } from '@/modules/content/message-board-post/message-board-post.module'

import { MiniappController } from './miniapp.controller'
import { MiniappService } from './miniapp.service'
import { MiniappPublicController } from './miniapp-public.controller'

@Module({
  imports: [MessageBoardPostModule],
  controllers: [MiniappController, MiniappPublicController],
  providers: [MiniappService],
})
export class MiniappModule {}
