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

import { Roles } from '@/common/auth/roles.decorator'
import { RolesGuard } from '@/common/auth/roles.guard'
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard'

import { CreateSystemUserDto } from './dto/create-system-user.dto'
import { ResetSystemUserPasswordDto } from './dto/reset-system-user-password.dto'
import { SystemUserListDto } from './dto/system-user-list.dto'
import { UpdateSystemUserDto } from './dto/update-system-user.dto'
import { UpdateSystemUserStatusDto } from './dto/update-system-user-status.dto'
import { SystemUserService } from './system-user.service'

@Controller('system/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class SystemUserController {
  constructor(private readonly systemUserService: SystemUserService) {}

  @Post()
  create(@Body() dto: CreateSystemUserDto) {
    return this.systemUserService.create(dto)
  }

  @Get()
  findAll(@Query() query: SystemUserListDto) {
    return this.systemUserService.findAll(query)
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSystemUserDto) {
    return this.systemUserService.update(id, dto)
  }

  @Patch(':id/status')
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSystemUserStatusDto) {
    return this.systemUserService.updateStatus(id, dto)
  }

  @Patch(':id/reset-password')
  resetPassword(@Param('id', ParseIntPipe) id: number, @Body() dto: ResetSystemUserPasswordDto) {
    return this.systemUserService.resetPassword(id, dto)
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.systemUserService.remove(id)
  }
}
