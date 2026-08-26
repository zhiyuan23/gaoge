import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common'

import { RequireAllPermissions, RequirePermissions } from '@/common/auth/permissions.decorator'
import { assertUserPermission, PermissionsGuard } from '@/common/auth/permissions.guard'
import { JwtAuthGuard } from '@/modules/auth/jwt-auth.guard'

import { CreateSystemRoleDto } from './dto/create-system-role.dto'
import { UpdateSystemRoleDto } from './dto/update-system-role.dto'
import { UpdateSystemRolePermissionsDto } from './dto/update-system-role-permissions.dto'
import { UpdateSystemRoleStatusDto } from './dto/update-system-role-status.dto'
import { SystemRoleService } from './system-role.service'

@Controller('system/roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SystemRoleController {
  constructor(private readonly systemRoleService: SystemRoleService) {}

  @Get()
  @RequirePermissions('system.role.view', 'system.user.create', 'system.user.update')
  findAll() {
    return this.systemRoleService.findAll()
  }

  @Post()
  @RequireAllPermissions('system.role.create', 'system.role.assign-permission')
  create(@Body() dto: CreateSystemRoleDto, @Req() request: { user?: { id?: number } }) {
    return this.systemRoleService.create(dto, request.user?.id)
  }

  @Patch(':id')
  @RequireAllPermissions('system.role.update', 'system.role.assign-permission')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSystemRoleDto,
    @Req() request: { user?: { id?: number; permissions?: string[] } },
  ) {
    if (dto.status) {
      assertUserPermission(
        request.user,
        dto.status === 'active' ? 'system.role.enable' : 'system.role.disable',
      )
    }
    return this.systemRoleService.update(id, dto, request.user?.id)
  }

  @Patch(':id/status')
  @RequirePermissions('system.role.enable', 'system.role.disable')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSystemRoleStatusDto,
    @Req() request: { user?: { id?: number; permissions?: string[] } },
  ) {
    assertUserPermission(
      request.user,
      dto.status === 'active' ? 'system.role.enable' : 'system.role.disable',
    )
    return this.systemRoleService.updateStatus(id, dto, request.user?.id)
  }

  @Get(':id/permissions')
  @RequirePermissions('system.role.view')
  getPermissions(@Param('id', ParseIntPipe) id: number) {
    return this.systemRoleService.getPermissions(id)
  }

  @Patch(':id/permissions')
  @RequirePermissions('system.role.assign-permission')
  updatePermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSystemRolePermissionsDto,
    @Req() request: { user?: { id?: number } },
  ) {
    return this.systemRoleService.updatePermissions(id, dto, request.user?.id)
  }

  @Delete(':id')
  @RequirePermissions('system.role.delete')
  remove(@Param('id', ParseIntPipe) id: number, @Req() request: { user?: { id?: number } }) {
    return this.systemRoleService.remove(id, request.user?.id)
  }
}
