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

import type { TeamListParams } from '@gaoge/shared-types'

import { Roles } from '@/common/auth/roles.decorator'
import { RolesGuard } from '@/common/auth/roles.guard'
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard'

import { CreateTeamDto } from './dto/create-team.dto'
import { UpdateTeamDto } from './dto/update-team.dto'
import { TeamsService } from './teams.service'

@Controller('football/teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  create(@Body() dto: CreateTeamDto) {
    return this.teamsService.create(dto)
  }

  @Get()
  findAll(@Query() query: TeamListParams) {
    return this.teamsService.findAll(query)
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.teamsService.findOne(id)
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTeamDto) {
    return this.teamsService.update(id, dto)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.teamsService.remove(id)
  }
}
