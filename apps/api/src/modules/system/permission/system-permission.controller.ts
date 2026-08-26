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

import type { SystemPermissionListParams } from '@gaoge/shared-types'

import { RequirePermissions } from '@/common/auth/permissions.decorator'
import { PermissionsGuard } from '@/common/auth/permissions.guard'
import { JwtAuthGuard } from '@/modules/auth/jwt-auth.guard'

import { CreateSystemPermissionDto } from './dto/create-system-permission.dto'
import { UpdateSystemPermissionDto } from './dto/update-system-permission.dto'
import { SystemPermissionService } from './system-permission.service'

@Controller('system/permissions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SystemPermissionController {
  constructor(private readonly systemPermissionService: SystemPermissionService) {}

  @Get()
  @RequirePermissions('system.permission.view')
  findAll(@Query() query: SystemPermissionListParams) {
    return this.systemPermissionService.findAll(query)
  }

  @Get('grouped')
  @RequirePermissions('system.permission.view')
  findGrouped() {
    return this.systemPermissionService.findGrouped()
  }

  @Post()
  @RequirePermissions('system.permission.create')
  create(@Body() dto: CreateSystemPermissionDto, @Req() request: { user?: { id?: number } }) {
    return this.systemPermissionService.create(dto, request.user?.id)
  }

  @Patch(':id')
  @RequirePermissions('system.permission.update')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSystemPermissionDto,
    @Req() request: { user?: { id?: number } },
  ) {
    return this.systemPermissionService.update(id, dto, request.user?.id)
  }

  @Delete(':id')
  @RequirePermissions('system.permission.delete')
  remove(@Param('id', ParseIntPipe) id: number, @Req() request: { user?: { id?: number } }) {
    return this.systemPermissionService.remove(id, request.user?.id)
  }

  @Post('sync-builtins')
  @RequirePermissions('system.permission.sync-builtins')
  syncBuiltIns(@Req() request: { user?: { id?: number } }) {
    return this.systemPermissionService.syncBuiltIns(request.user?.id)
  }
}
