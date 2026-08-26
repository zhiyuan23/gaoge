import { Module } from '@nestjs/common'

import { SystemAuditModule } from '../audit/system-audit.module'

import { SystemRoleController } from './system-role.controller'
import { SystemRoleService } from './system-role.service'

@Module({
  imports: [SystemAuditModule],
  controllers: [SystemRoleController],
  providers: [SystemRoleService],
  exports: [SystemRoleService],
})
export class SystemRoleModule {}
