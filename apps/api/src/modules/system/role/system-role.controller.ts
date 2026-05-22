import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common'

import { RequirePermissions } from '@/common/auth/permissions.decorator'
import { PermissionsGuard } from '@/common/auth/permissions.guard'
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard'

import { CreateSystemRoleDto } from './dto/create-system-role.dto'
import { UpdateSystemRoleDto } from './dto/update-system-role.dto'
import { UpdateSystemRoleMenuAccessDto } from './dto/update-system-role-menu-access.dto'
import { UpdateSystemRolePermissionsDto } from './dto/update-system-role-permissions.dto'
import { UpdateSystemRoleStatusDto } from './dto/update-system-role-status.dto'
import { UpdateSystemRoleWorkspaceDto } from './dto/update-system-role-workspace.dto'
import { SystemRoleService } from './system-role.service'

@Controller('system/roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SystemRoleController {
  constructor(private readonly systemRoleService: SystemRoleService) {}

  @Get()
  @RequirePermissions('system.role.view')
  findAll() {
    return this.systemRoleService.findAll()
  }

  @Post()
  @RequirePermissions('system.role.create')
  create(@Body() dto: CreateSystemRoleDto) {
    return this.systemRoleService.create(dto)
  }

  @Patch(':id')
  @RequirePermissions('system.role.update')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSystemRoleDto) {
    return this.systemRoleService.update(id, dto)
  }

  @Patch(':id/status')
  @RequirePermissions('system.role.enable', 'system.role.disable')
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSystemRoleStatusDto) {
    return this.systemRoleService.updateStatus(id, dto)
  }

  @Get(':id/permissions')
  @RequirePermissions('system.role.view')
  getPermissions(@Param('id', ParseIntPipe) id: number) {
    return this.systemRoleService.getPermissions(id)
  }

  @Get(':id/detail')
  @RequirePermissions('system.role.view')
  getDetail(@Param('id', ParseIntPipe) id: number) {
    return this.systemRoleService.getDetail(id)
  }

  @Get(':id/compare/:targetRoleId')
  @RequirePermissions('system.role.view')
  compare(
    @Param('id', ParseIntPipe) id: number,
    @Param('targetRoleId', ParseIntPipe) targetRoleId: number,
  ) {
    return this.systemRoleService.compare(id, targetRoleId)
  }

  @Patch(':id/menu-access')
  @RequirePermissions('system.role.assign-permission')
  updateMenuAccess(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSystemRoleMenuAccessDto,
  ) {
    return this.systemRoleService.updateMenuAccess(id, dto)
  }

  @Patch(':id/permissions')
  @RequirePermissions('system.role.assign-permission')
  updatePermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSystemRolePermissionsDto,
  ) {
    return this.systemRoleService.updatePermissions(id, dto)
  }

  @Patch(':id/workspace')
  @RequirePermissions('system.role.assign-permission')
  updateWorkspace(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSystemRoleWorkspaceDto,
  ) {
    return this.systemRoleService.updateWorkspace(id, dto)
  }

  @Delete(':id')
  @RequirePermissions('system.role.delete')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.systemRoleService.remove(id)
  }
}
