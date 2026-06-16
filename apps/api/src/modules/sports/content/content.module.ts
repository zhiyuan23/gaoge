import { Module } from '@nestjs/common'

import { BannerModule } from './banner/banner.module'
import { RumorPostModule } from './rumor-post/rumor-post.module'

@Module({
  imports: [BannerModule, RumorPostModule],
  exports: [BannerModule, RumorPostModule],
})
export class ContentModule {}
