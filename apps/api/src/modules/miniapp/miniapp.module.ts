import { Module } from '@nestjs/common'

import { RumorPostModule } from '@/modules/sports/content/rumor-post/rumor-post.module'

import { MiniappController } from './miniapp.controller'
import { MiniappService } from './miniapp.service'
import { MiniappPublicController } from './miniapp-public.controller'

@Module({
  imports: [RumorPostModule],
  controllers: [MiniappController, MiniappPublicController],
  providers: [MiniappService],
})
export class MiniappModule {}
