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

import { RequirePermissions } from '@/common/auth/permissions.decorator'
import { PermissionsGuard } from '@/common/auth/permissions.guard'
import { JwtAuthGuard } from '@/modules/auth/jwt-auth.guard'

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
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('football.assetRecord.create')
  create(@Body() dto: CreateAssetRecordDto, @Req() req: { user: { id: number } }) {
    return this.assetRecordService.create(dto, req.user.id)
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('football.assetRecord.update')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAssetRecordDto) {
    return this.assetRecordService.update(id, dto)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('football.assetRecord.delete')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.assetRecordService.remove(id)
  }
}
