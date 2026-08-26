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

import { RequirePermissions } from '@/common/auth/permissions.decorator'
import { PermissionsGuard } from '@/common/auth/permissions.guard'
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
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('football.matchRound.create')
  create(@Body() dto: CreateMatchRoundDto) {
    return this.matchRoundService.create(dto)
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('football.matchRound.update')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMatchRoundDto) {
    return this.matchRoundService.update(id, dto)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('football.matchRound.delete')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.matchRoundService.remove(id)
  }
}
