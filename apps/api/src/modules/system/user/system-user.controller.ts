import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common'

import { RequirePermissions } from '@/common/auth/permissions.decorator'
import { assertUserPermission, PermissionsGuard } from '@/common/auth/permissions.guard'
import { JwtAuthGuard } from '@/modules/auth/jwt-auth.guard'

import { CreateSystemUserDto } from './dto/create-system-user.dto'
import { ResetSystemUserPasswordDto } from './dto/reset-system-user-password.dto'
import { SystemUserListDto } from './dto/system-user-list.dto'
import { UpdateSystemUserDto } from './dto/update-system-user.dto'
import { UpdateSystemUserStatusDto } from './dto/update-system-user-status.dto'
import { SystemUserService } from './system-user.service'

@Controller('system/users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SystemUserController {
  constructor(private readonly systemUserService: SystemUserService) {}

  @Post()
  @RequirePermissions('system.user.create')
  create(@Body() dto: CreateSystemUserDto, @Req() request: { user?: { id?: number } }) {
    return this.systemUserService.create(dto, request.user?.id)
  }

  @Get()
  @RequirePermissions('system.user.view')
  findAll(@Query() query: SystemUserListDto) {
    return this.systemUserService.findAll(query)
  }

  @Patch(':id')
  @RequirePermissions('system.user.update')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSystemUserDto,
    @Req() request: { user?: { id?: number; permissions?: string[] } },
  ) {
    if (dto.status) {
      assertUserPermission(
        request.user,
        dto.status === 'active' ? 'system.user.enable' : 'system.user.disable',
      )
    }
    return this.systemUserService.update(id, dto, request.user?.id)
  }

  @Patch(':id/status')
  @RequirePermissions('system.user.enable', 'system.user.disable')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSystemUserStatusDto,
    @Req() request: { user?: { id?: number; permissions?: string[] } },
  ) {
    assertUserPermission(
      request.user,
      dto.status === 'active' ? 'system.user.enable' : 'system.user.disable',
    )
    return this.systemUserService.updateStatus(id, dto, request.user?.id)
  }

  @Patch(':id/reset-password')
  @RequirePermissions('system.user.reset-password')
  resetPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResetSystemUserPasswordDto,
    @Req() request: { user?: { id?: number } },
  ) {
    return this.systemUserService.resetPassword(id, dto, request.user?.id)
  }

  @Delete(':id')
  @RequirePermissions('system.user.delete')
  remove(@Param('id', ParseIntPipe) id: number, @Req() request: { user?: { id?: number } }) {
    return this.systemUserService.remove(id, request.user?.id)
  }
}
