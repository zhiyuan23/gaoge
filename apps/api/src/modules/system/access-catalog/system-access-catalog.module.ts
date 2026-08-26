import { Module } from '@nestjs/common'

import { SystemMenuModule } from '../menu/system-menu.module'
import { SystemResourceModule } from '../resource/system-resource.module'

import { SystemAccessCatalogController } from './system-access-catalog.controller'
import { SystemAccessCatalogService } from './system-access-catalog.service'

@Module({
  imports: [SystemMenuModule, SystemResourceModule],
  controllers: [SystemAccessCatalogController],
  providers: [SystemAccessCatalogService],
})
export class SystemAccessCatalogModule {}
