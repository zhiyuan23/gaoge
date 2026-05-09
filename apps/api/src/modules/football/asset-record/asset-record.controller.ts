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
  Req,
  UseGuards,
} from '@nestjs/common'

import { Roles } from '@/common/auth/roles.decorator'
import { RolesGuard } from '@/common/auth/roles.guard'
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard'

import { AssetRecordListDto } from './dto/asset-record-list.dto'
import { CreateAssetRecordDto } from './dto/create-asset-record.dto'
import { UpdateAssetRecordDto } from './dto/update-asset-record.dto'
import { AssetRecordService } from './asset-record.service'

@Controller('football/asset-records')
export class AssetRecordController {
  constructor(private readonly assetRecordService: AssetRecordService) {}

  @Get('summary')
  getSummary() {
    return this.assetRecordService.getSummary()
  }

  @Get()
  findAll(@Query() query: AssetRecordListDto) {
    return this.assetRecordService.findAll(query)
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.assetRecordService.findOne(id)
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  create(@Body() dto: CreateAssetRecordDto, @Req() req: { user: { id: number } }) {
    return this.assetRecordService.create(dto, req.user.id)
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAssetRecordDto) {
    return this.assetRecordService.update(id, dto)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.assetRecordService.remove(id)
  }
}
