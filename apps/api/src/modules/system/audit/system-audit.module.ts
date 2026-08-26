import { Module } from '@nestjs/common'

import { AuditLogService } from '@/common/audit/audit-log.service'
import { PrismaModule } from '@/common/prisma/prisma.module'

import { SystemAuditController } from './system-audit.controller'
import { SystemAuditService } from './system-audit.service'

@Module({
  imports: [PrismaModule],
  controllers: [SystemAuditController],
  providers: [AuditLogService, SystemAuditService],
  exports: [AuditLogService],
})
export class SystemAuditModule {}
