import { Module } from '@nestjs/common'

import { RbacModule } from '../rbac/rbac.module'

import { SystemPermissionController } from './system-permission.controller'
import { SystemPermissionService } from './system-permission.service'

@Module({
  imports: [RbacModule],
  controllers: [SystemPermissionController],
  providers: [SystemPermissionService],
  exports: [SystemPermissionService],
})
export class SystemPermissionModule {}
