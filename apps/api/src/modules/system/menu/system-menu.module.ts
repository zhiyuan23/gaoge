import { Module } from '@nestjs/common'

import { SystemAuditModule } from '../audit/system-audit.module'

import { SystemMenuController } from './system-menu.controller'
import { SystemMenuService } from './system-menu.service'
import { SystemMenuConfigurationService } from './system-menu-configuration.service'

@Module({
  imports: [SystemAuditModule],
  controllers: [SystemMenuController],
  providers: [SystemMenuConfigurationService, SystemMenuService],
  exports: [SystemMenuService],
})
export class SystemMenuModule {}
