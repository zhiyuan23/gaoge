import { Module } from '@nestjs/common'

import { SystemAuditModule } from '../audit/system-audit.module'

import { SystemUserController } from './system-user.controller'
import { SystemUserService } from './system-user.service'

@Module({
  imports: [SystemAuditModule],
  controllers: [SystemUserController],
  providers: [SystemUserService],
})
export class SystemUserModule {}
