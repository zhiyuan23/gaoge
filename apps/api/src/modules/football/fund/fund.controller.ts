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

import { CreateFundDto, QueryFundDto, UpdateFundDto } from './dto/fund.dto'
import { FundService } from './fund.service'

@Controller('football/fund')
export class FundController {
  constructor(private readonly fundService: FundService) {}

  /**
   * 获取资金汇总
   */
  @Get('summary')
  getSummary() {
    return this.fundService.getSummary()
  }

  /**
   * 获取资金记录列表
   */
  @Get()
  findAll(@Query() query: QueryFundDto) {
    return this.fundService.findAll(query)
  }

  /**
   * 获取单条记录
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.fundService.findOne(id)
  }

  /**
   * 创建资金记录 (仅管理员)
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  create(@Body() dto: CreateFundDto, @Req() req: { user: { id: number } }) {
    return this.fundService.create(dto, req.user.id)
  }

  /**
   * 更新资金记录 (需要管理员权限)
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateFundDto) {
    return this.fundService.update(id, dto)
  }

  /**
   * 删除资金记录 (需要管理员权限)
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.fundService.remove(id)
  }
}
