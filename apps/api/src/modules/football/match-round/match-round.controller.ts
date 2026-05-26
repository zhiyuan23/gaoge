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

import type { MatchRoundListParams } from '@gaoge/shared-types'

import { Roles } from '@/common/auth/roles.decorator'
import { RolesGuard } from '@/common/auth/roles.guard'
import { JwtAuthGuard } from '@/modules/auth/jwt-auth.guard'

import { CreateMatchRoundDto } from './dto/create-match-round.dto'
import { UpdateMatchRoundDto } from './dto/update-match-round.dto'
import { MatchRoundService } from './match-round.service'

@Controller('football/match-rounds')
export class MatchRoundController {
  constructor(private readonly matchRoundService: MatchRoundService) {}

  @Get()
  findAll(@Query() query: MatchRoundListParams) {
    return this.matchRoundService.findAll(query)
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.matchRoundService.findOne(id)
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  create(@Body() dto: CreateMatchRoundDto) {
    return this.matchRoundService.create(dto)
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMatchRoundDto) {
    return this.matchRoundService.update(id, dto)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.matchRoundService.remove(id)
  }
}
