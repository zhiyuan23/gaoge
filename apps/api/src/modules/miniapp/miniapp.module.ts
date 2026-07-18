import { Module } from '@nestjs/common'

import { AuthModule } from '@/modules/auth/auth.module'
import { RumorPostModule } from '@/modules/sports/content/rumor-post/rumor-post.module'

import { MiniappController } from './miniapp.controller'
import { MiniappService } from './miniapp.service'
import { MiniappAuthController } from './miniapp-auth.controller'
import { MiniappPublicController } from './miniapp-public.controller'

@Module({
  imports: [AuthModule, RumorPostModule],
  controllers: [MiniappAuthController, MiniappController, MiniappPublicController],
  providers: [MiniappService],
})
export class MiniappModule {}
