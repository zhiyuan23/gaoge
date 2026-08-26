import { Controller, Get, UseGuards } from '@nestjs/common'

import { RequirePermissions } from '@/common/auth/permissions.decorator'
import { PermissionsGuard } from '@/common/auth/permissions.guard'
import { JwtAuthGuard } from '@/modules/auth/jwt-auth.guard'

import { SystemAccessCatalogService } from './system-access-catalog.service'

@Controller('system/access-catalog')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SystemAccessCatalogController {
  constructor(private readonly catalog: SystemAccessCatalogService) {}

  @Get()
  @RequirePermissions('system.menu.view', 'system.permission.view', 'system.role.view')
  getCatalog() {
    return this.catalog.getCatalog()
  }
}
