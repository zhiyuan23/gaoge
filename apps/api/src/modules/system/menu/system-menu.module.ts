import { Module } from '@nestjs/common'

import { SystemMenuController } from './system-menu.controller'
import { SystemMenuService } from './system-menu.service'

@Module({
  controllers: [SystemMenuController],
  providers: [SystemMenuService],
})
export class SystemMenuModule {}
