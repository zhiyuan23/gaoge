import { Controller, Get, Req, UseGuards } from '@nestjs/common'

import { PermissionsGuard } from '@/common/auth/permissions.guard'
import { JwtAuthGuard } from '@/modules/auth/jwt-auth.guard'

import { NavigationService } from './navigation.service'

@Controller('admin/navigation')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class NavigationController {
  constructor(private readonly navigation: NavigationService) {}

  @Get()
  visibleMenus(@Req() request: { user: { id: number } }) {
    return this.navigation.getVisibleMenus(request.user.id)
  }
}
