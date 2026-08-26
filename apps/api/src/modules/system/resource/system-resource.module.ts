import { Module } from '@nestjs/common'

import { SystemAuditModule } from '../audit/system-audit.module'

import { SystemResourceController } from './system-resource.controller'
import { SystemResourceService } from './system-resource.service'

@Module({
  imports: [SystemAuditModule],
  controllers: [SystemResourceController],
  providers: [SystemResourceService],
  exports: [SystemResourceService],
})
export class SystemResourceModule {}
