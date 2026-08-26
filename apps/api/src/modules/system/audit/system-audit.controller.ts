import { Controller, Get, Query, UseGuards } from '@nestjs/common'

import { RequirePermissions } from '@/common/auth/permissions.decorator'
import { PermissionsGuard } from '@/common/auth/permissions.guard'
import { JwtAuthGuard } from '@/modules/auth/jwt-auth.guard'

import { SystemAuditListDto } from './dto/system-audit-list.dto'
import { SystemAuditService } from './system-audit.service'

@Controller('system/audit-events')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SystemAuditController {
  constructor(private readonly systemAuditService: SystemAuditService) {}

  @Get()
  @RequirePermissions('system.audit.view')
  findAll(@Query() query: SystemAuditListDto) {
    return this.systemAuditService.findAll(query)
  }
}
