import { Module } from '@nestjs/common'

import { SystemRoleController } from './system-role.controller'
import { SystemRoleService } from './system-role.service'

@Module({
  controllers: [SystemRoleController],
  providers: [SystemRoleService],
  exports: [SystemRoleService],
})
export class SystemRoleModule {}
