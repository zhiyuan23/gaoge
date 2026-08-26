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
import { PermissionsGuard } from '@/common/auth/permissions.guard'
import { JwtAuthGuard } from '@/modules/auth/jwt-auth.guard'

import { CreateSystemResourceDto } from './dto/create-system-resource.dto'
import { CreateSystemResourcePermissionDto } from './dto/create-system-resource-permission.dto'
import { SystemResourceListDto } from './dto/system-resource-list.dto'
import { UpdateSystemResourceDto } from './dto/update-system-resource.dto'
import { UpdateSystemResourceStatusDto } from './dto/update-system-resource-status.dto'
import { SystemResourceService } from './system-resource.service'

type AuthenticatedRequest = { user?: { id?: number } }

@Controller('system/resources')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SystemResourceController {
  constructor(private readonly systemResourceService: SystemResourceService) {}

  @Get()
  @RequirePermissions('system.permission.view')
  findAll(@Query() query: SystemResourceListDto) {
    return this.systemResourceService.findAll(query)
  }

  @Post()
  @RequirePermissions('system.permission.create')
  create(@Body() dto: CreateSystemResourceDto, @Req() request: AuthenticatedRequest) {
    return this.systemResourceService.create(dto, request.user?.id)
  }

  @Patch(':id')
  @RequirePermissions('system.permission.update')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSystemResourceDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.systemResourceService.update(id, dto, request.user?.id)
  }

  @Patch(':id/status')
  @RequirePermissions('system.permission.update')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSystemResourceStatusDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.systemResourceService.updateStatus(id, dto, request.user?.id)
  }

  @Post(':id/permissions')
  @RequirePermissions('system.permission.create')
  createPermission(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateSystemResourcePermissionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.systemResourceService.createPermission(id, dto, request.user?.id)
  }

  @Delete(':id')
  @RequirePermissions('system.permission.delete')
  remove(@Param('id', ParseIntPipe) id: number, @Req() request: AuthenticatedRequest) {
    return this.systemResourceService.remove(id, request.user?.id)
  }
}
