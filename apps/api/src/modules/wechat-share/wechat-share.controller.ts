import { Body, Controller, Get, Put, Query, UseGuards } from '@nestjs/common'

import { RequirePermissions } from '@/common/auth/permissions.decorator'
import { PermissionsGuard } from '@/common/auth/permissions.guard'
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard'

import { GetWechatSharePublicConfigDto } from './dto/get-wechat-share-public-config.dto'
import { JssdkSignatureQueryDto } from './dto/jssdk-signature-query.dto'
import { UpdateWechatShareAdminConfigDto } from './dto/update-wechat-share-admin-config.dto'
import { WechatShareService } from './wechat-share.service'

@Controller('wechat/share')
export class WechatShareController {
  constructor(private readonly wechatShareService: WechatShareService) {}

  @Get('jssdk-signature')
  getJssdkSignature(@Query() query: JssdkSignatureQueryDto) {
    return this.wechatShareService.getJssdkSignature(query.url)
  }

  @Get('admin-config')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('system.wechat-share.view')
  getAdminConfig() {
    return this.wechatShareService.getAdminConfig()
  }

  @Put('admin-config')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('system.wechat-share.update')
  updateAdminConfig(@Body() dto: UpdateWechatShareAdminConfigDto) {
    return this.wechatShareService.updateAdminConfig(dto)
  }

  @Get('public-config')
  getPublicConfig(@Query() query: GetWechatSharePublicConfigDto) {
    return this.wechatShareService.getPublicConfig(query.path)
  }
}
