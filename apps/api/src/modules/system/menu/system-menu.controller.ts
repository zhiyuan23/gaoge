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
import { PermissionsGuard } from '@/common/auth/permissions.guard'
import { JwtAuthGuard } from '@/modules/auth/jwt-auth.guard'

import { CreateSystemMenuDto } from './dto/create-system-menu.dto'
import { UpdateSystemMenuDto } from './dto/update-system-menu.dto'
import { UpdateSystemMenuPermissionsDto } from './dto/update-system-menu-permissions.dto'
import { UpdateSystemMenuResourcesDto } from './dto/update-system-menu-resources.dto'
import { SystemMenuService } from './system-menu.service'
import { SystemMenuConfigurationService } from './system-menu-configuration.service'

@Controller('system/menus')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SystemMenuController {
  constructor(
    private readonly systemMenuService: SystemMenuService,
    private readonly configuration: SystemMenuConfigurationService,
  ) {}

  @Get('tree')
  @RequirePermissions('system.menu.view')
  findTree() {
    return this.systemMenuService.findTree()
  }

  @Post()
  @RequireAllPermissions('system.menu.create', 'system.menu.assign-permission')
  create(@Body() dto: CreateSystemMenuDto, @Req() request: { user?: { id?: number } }) {
    return this.configuration.create(dto, request.user?.id)
  }

  @Patch(':id')
  @RequireAllPermissions('system.menu.update', 'system.menu.assign-permission')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSystemMenuDto,
    @Req() request: { user?: { id?: number } },
  ) {
    return this.configuration.update(id, dto, request.user?.id)
  }

  @Patch(':id/sort')
  @RequirePermissions('system.menu.sort')
  updateSort(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { sort: number },
    @Req() request: { user?: { id?: number } },
  ) {
    return this.configuration.updateSort(id, dto, request.user?.id)
  }

  @Patch(':id/permissions')
  @RequirePermissions('system.menu.assign-permission')
  updatePermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSystemMenuPermissionsDto,
    @Req() request: { user?: { id?: number } },
  ) {
    return this.configuration.updatePermissions(id, dto, request.user?.id)
  }

  @Patch(':id/resources')
  @RequirePermissions('system.menu.assign-permission')
  updateResources(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSystemMenuResourcesDto,
    @Req() request: { user?: { id?: number } },
  ) {
    return this.configuration.updateResources(id, dto, request.user?.id)
  }

  @Delete(':id')
  @RequirePermissions('system.menu.delete')
  remove(@Param('id', ParseIntPipe) id: number, @Req() request: { user?: { id?: number } }) {
    return this.configuration.remove(id, request.user?.id)
  }
}
