import { Module } from '@nestjs/common'

import { RbacModule } from '@/modules/system/rbac/rbac.module'

import { NavigationController } from './navigation.controller'
import { NavigationService } from './navigation.service'

@Module({
  imports: [RbacModule],
  controllers: [NavigationController],
  providers: [NavigationService],
})
export class NavigationModule {}
