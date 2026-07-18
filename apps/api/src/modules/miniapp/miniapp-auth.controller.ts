import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common'

import { AuthService } from '@/modules/auth/auth.service'
import { MiniappLoginDto } from '@/modules/auth/dto/login.dto'
import { JwtAuthGuard } from '@/modules/auth/jwt-auth.guard'

import { buildProfileSummary, MiniappService } from './miniapp.service'
import {
  MINI_API_VERSION,
  type MiniApiMeta,
  type MiniApiSuccess,
  type MiniProfileSummaryDto,
  type MiniWechatLoginResponseDto,
} from './miniapp-auth.contract'

type MiniRequest = {
  headers?: Record<string, string | string[] | undefined>
}

type MiniAuthedRequest = MiniRequest & {
  user: {
    id: number
  }
}

@Controller('mini/v1/auth')
export class MiniappAuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly miniappService: MiniappService,
  ) {}

  @Post('wechat-login')
  @HttpCode(HttpStatus.OK)
  async wechatLogin(
    @Body() dto: MiniappLoginDto,
    @Req() request: MiniRequest,
  ): Promise<MiniApiSuccess<MiniWechatLoginResponseDto>> {
    const loginResult = await this.authService.wechatLogin(dto)

    return miniSuccess(
      {
        accessToken: loginResult.accessToken,
        expiresIn: loginResult.expiresIn,
        profileSummary: buildProfileSummary({
          id: loginResult.user.id,
          nickname: loginResult.user.nickname,
          avatarUrl: loginResult.user.avatarUrl,
          phone: loginResult.user.phone,
        }),
      },
      request,
    )
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async profile(@Req() request: MiniAuthedRequest): Promise<MiniApiSuccess<MiniProfileSummaryDto>> {
    const profileSummary = await this.miniappService.getProfileSummary(request.user.id)

    return miniSuccess(profileSummary, request)
  }
}

function miniSuccess<T>(data: T, request: MiniRequest): MiniApiSuccess<T> {
  return {
    success: true,
    data,
    meta: createMiniApiMeta(request),
  }
}

function createMiniApiMeta(request: MiniRequest): MiniApiMeta {
  return {
    requestId: resolveRequestId(request),
    serverTime: new Date().toISOString(),
    apiVersion: MINI_API_VERSION,
  }
}

function resolveRequestId(request: MiniRequest) {
  const value = request.headers?.['x-request-id']

  if (Array.isArray(value)) {
    return value[0] || createFallbackRequestId()
  }

  return value || createFallbackRequestId()
}

function createFallbackRequestId() {
  return `server-${Date.now()}`
}
