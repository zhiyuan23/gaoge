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
import { JwtAuthGuard } from '@/modules/auth/jwt-auth.guard'

import { CreateRumorPostDto } from './dto/create-rumor-post.dto'
import { RumorPostListDto } from './dto/rumor-post-list.dto'
import { UpdateRumorPostDto } from './dto/update-rumor-post.dto'
import { RumorPostService } from './rumor-post.service'

@Controller('content/rumor-posts')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RumorPostController {
  constructor(private readonly rumorPostService: RumorPostService) {}

  @Get()
  @RequirePermissions('content.rumorPost.view')
  findAll(@Query() query: RumorPostListDto) {
    return this.rumorPostService.findAll(query)
  }

  @Get(':id')
  @RequirePermissions('content.rumorPost.view')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.rumorPostService.findOne(id)
  }

  @Post()
  @RequirePermissions('content.rumorPost.create')
  create(@Body() dto: CreateRumorPostDto) {
    return this.rumorPostService.create(dto)
  }

  @Patch(':id')
  @RequirePermissions('content.rumorPost.update')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRumorPostDto) {
    return this.rumorPostService.update(id, dto)
  }

  @Delete(':id')
  @RequirePermissions('content.rumorPost.delete')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.rumorPostService.remove(id)
  }

  @Post(':id/publish')
  @RequirePermissions('content.rumorPost.publish')
  publish(@Param('id', ParseIntPipe) id: number) {
    return this.rumorPostService.publish(id)
  }
}
