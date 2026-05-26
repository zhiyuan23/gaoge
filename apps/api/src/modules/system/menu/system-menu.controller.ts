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
import { JwtAuthGuard } from '@/modules/auth/jwt-auth.guard'

import { CreateSystemMenuDto } from './dto/create-system-menu.dto'
import { UpdateSystemMenuDto } from './dto/update-system-menu.dto'
import { UpdateSystemMenuPermissionsDto } from './dto/update-system-menu-permissions.dto'
import { SystemMenuService } from './system-menu.service'

@Controller('system/menus')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SystemMenuController {
  constructor(private readonly systemMenuService: SystemMenuService) {}

  @Get('tree')
  @RequirePermissions('system.menu.view')
  findTree() {
    return this.systemMenuService.findTree()
  }

  @Post()
  @RequirePermissions('system.menu.create')
  create(@Body() dto: CreateSystemMenuDto) {
    return this.systemMenuService.create(dto)
  }

  @Patch(':id')
  @RequirePermissions('system.menu.update')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSystemMenuDto) {
    return this.systemMenuService.update(id, dto)
  }

  @Patch(':id/sort')
  @RequirePermissions('system.menu.sort')
  updateSort(@Param('id', ParseIntPipe) id: number, @Body() dto: { sort: number }) {
    return this.systemMenuService.updateSort(id, dto)
  }

  @Patch(':id/permissions')
  @RequirePermissions('system.menu.assign-permission')
  updatePermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSystemMenuPermissionsDto,
  ) {
    return this.systemMenuService.updatePermissions(id, dto)
  }

  @Delete(':id')
  @RequirePermissions('system.menu.delete')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.systemMenuService.remove(id)
  }
}
