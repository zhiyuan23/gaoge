import { Module } from '@nestjs/common'

import { SystemAccessCatalogModule } from './access-catalog/system-access-catalog.module'
import { SystemAuditModule } from './audit/system-audit.module'
import { SystemMenuModule } from './menu/system-menu.module'
import { SystemPermissionModule } from './permission/system-permission.module'
import { RbacModule } from './rbac/rbac.module'
import { SystemResourceModule } from './resource/system-resource.module'
import { SystemRoleModule } from './role/system-role.module'
import { SystemUserModule } from './user/system-user.module'

@Module({
  imports: [
    SystemAuditModule,
    SystemAccessCatalogModule,
    RbacModule,
    SystemUserModule,
    SystemRoleModule,
    SystemResourceModule,
    SystemPermissionModule,
    SystemMenuModule,
  ],
})
export class SystemModule {}
