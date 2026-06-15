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

import { JwtAuthGuard } from '@/modules/auth/jwt-auth.guard'

import { BannerListDto } from './dto/banner-list.dto'
import { CreateBannerDto } from './dto/create-banner.dto'
import { UpdateBannerDto } from './dto/update-banner.dto'
import { BannerService } from './banner.service'

@Controller('content/banners')
export class BannerController {
  constructor(private readonly bannerService: BannerService) {}

  @Get()
  findPublished() {
    return this.bannerService.findPublished()
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard)
  findAll(@Query() query: BannerListDto) {
    return this.bannerService.findAll(query)
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.bannerService.findOne(id)
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateBannerDto) {
    return this.bannerService.create(dto)
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBannerDto) {
    return this.bannerService.update(id, dto)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.bannerService.remove(id)
  }
}
