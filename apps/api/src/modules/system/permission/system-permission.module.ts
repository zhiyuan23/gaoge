import { Module } from '@nestjs/common'

import { SystemAuditModule } from '../audit/system-audit.module'
import { RbacModule } from '../rbac/rbac.module'

import { SystemPermissionController } from './system-permission.controller'
import { SystemPermissionService } from './system-permission.service'

@Module({
  imports: [RbacModule, SystemAuditModule],
  controllers: [SystemPermissionController],
  providers: [SystemPermissionService],
  exports: [SystemPermissionService],
})
export class SystemPermissionModule {}
