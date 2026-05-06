import { Module } from '@nestjs/common'

import { SystemUserModule } from './user/system-user.module'

@Module({
  imports: [SystemUserModule],
})
export class SystemModule {}
