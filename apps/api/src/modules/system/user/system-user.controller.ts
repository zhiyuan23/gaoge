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
  UseGuards,
} from '@nestjs/common'

import { RequirePermissions } from '@/common/auth/permissions.decorator'
import { PermissionsGuard } from '@/common/auth/permissions.guard'
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard'

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
  create(@Body() dto: CreateSystemUserDto) {
    return this.systemUserService.create(dto)
  }

  @Get()
  @RequirePermissions('system.user.view')
  findAll(@Query() query: SystemUserListDto) {
    return this.systemUserService.findAll(query)
  }

  @Patch(':id')
  @RequirePermissions('system.user.update')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSystemUserDto) {
    return this.systemUserService.update(id, dto)
  }

  @Patch(':id/status')
  @RequirePermissions('system.user.enable', 'system.user.disable')
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSystemUserStatusDto) {
    return this.systemUserService.updateStatus(id, dto)
  }

  @Patch(':id/reset-password')
  @RequirePermissions('system.user.reset-password')
  resetPassword(@Param('id', ParseIntPipe) id: number, @Body() dto: ResetSystemUserPasswordDto) {
    return this.systemUserService.resetPassword(id, dto)
  }

  @Delete(':id')
  @RequirePermissions('system.user.delete')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.systemUserService.remove(id)
  }
}
