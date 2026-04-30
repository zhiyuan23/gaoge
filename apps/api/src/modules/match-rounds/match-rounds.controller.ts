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
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard'

import { CreateMatchRoundDto } from './dto/create-match-round.dto'
import { UpdateMatchRoundDto } from './dto/update-match-round.dto'
import { MatchRoundsService } from './match-rounds.service'

@Controller('match-rounds')
export class MatchRoundsController {
  constructor(private readonly matchRoundsService: MatchRoundsService) {}

  @Get()
  findAll(@Query() query: MatchRoundListParams) {
    return this.matchRoundsService.findAll(query)
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.matchRoundsService.findOne(id)
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  create(@Body() dto: CreateMatchRoundDto) {
    return this.matchRoundsService.create(dto)
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMatchRoundDto) {
    return this.matchRoundsService.update(id, dto)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.matchRoundsService.remove(id)
  }
}
