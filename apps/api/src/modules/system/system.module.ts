import { Module } from '@nestjs/common'

import { SystemMenuModule } from './menu/system-menu.module'
import { SystemPermissionModule } from './permission/system-permission.module'
import { RbacModule } from './rbac/rbac.module'
import { SystemRoleModule } from './role/system-role.module'
import { SystemUserModule } from './user/system-user.module'

@Module({
  imports: [
    RbacModule,
    SystemUserModule,
    SystemRoleModule,
    SystemPermissionModule,
    SystemMenuModule,
  ],
})
export class SystemModule {}
