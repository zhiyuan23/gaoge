import { Module } from '@nestjs/common'

import { WechatShareController } from './wechat-share.controller'
import { WechatShareService } from './wechat-share.service'

@Module({
  controllers: [WechatShareController],
  providers: [WechatShareService],
})
export class WechatShareModule {}
