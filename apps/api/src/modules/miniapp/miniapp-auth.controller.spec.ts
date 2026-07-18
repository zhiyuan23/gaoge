import { GUARDS_METADATA, PATH_METADATA } from '@nestjs/common/constants'

import { JwtAuthGuard } from '@/modules/auth/jwt-auth.guard'

import { MiniappAuthController } from './miniapp-auth.controller'

describe('MiniappAuthController', () => {
  it('uses the mini/v1 auth controller prefix', () => {
    expect(Reflect.getMetadata(PATH_METADATA, MiniappAuthController)).toBe('mini/v1/auth')
  })

  it('maps wechatLogin to /mini/v1/auth/wechat-login', () => {
    expect(Reflect.getMetadata(PATH_METADATA, MiniappAuthController.prototype.wechatLogin)).toBe(
      'wechat-login',
    )
  })

  it('maps profile to /mini/v1/auth/profile with JwtAuthGuard', () => {
    expect(Reflect.getMetadata(PATH_METADATA, MiniappAuthController.prototype.profile)).toBe(
      'profile',
    )
    expect(Reflect.getMetadata(GUARDS_METADATA, MiniappAuthController.prototype.profile)).toEqual([
      JwtAuthGuard,
    ])
  })

  it('returns a mini api result for silent wechat login without exposing openid', async () => {
    const authService = {
      wechatLogin: jest.fn().mockResolvedValue({
        accessToken: 'access-token',
        expiresIn: 7200,
        refreshToken: 'refresh-token',
        user: {
          id: 12,
          openid: 'wx-openid-secret',
          nickname: '高歌用户',
          avatarUrl: 'https://example.com/avatar.png',
          phone: '13800000000',
          status: 'active',
          isBound: false,
        },
        player: null,
      }),
    }
    const miniappService = {
      getProfileSummary: jest.fn(),
    }
    const controller = new MiniappAuthController(authService as any, miniappService as any)

    const result = await controller.wechatLogin(
      { code: 'wx-code' },
      { headers: { 'x-request-id': 'req-login' } },
    )

    expect(authService.wechatLogin).toHaveBeenCalledWith({ code: 'wx-code' })
    expect(result.success).toBe(true)
    expect(result.meta.requestId).toBe('req-login')
    expect(result.data).toEqual({
      accessToken: 'access-token',
      expiresIn: 7200,
      profileSummary: {
        userId: '12',
        nickname: '高歌用户',
        avatarUrl: 'https://example.com/avatar.png',
        phoneMasked: '138****0000',
        phoneBound: true,
        privacyAccepted: false,
      },
    })
    expect(JSON.stringify(result)).not.toContain('wx-openid-secret')
    expect(JSON.stringify(result)).not.toContain('refresh-token')
  })

  it('returns the current token profile as a mini api result', async () => {
    const authService = {
      wechatLogin: jest.fn(),
    }
    const miniappService = {
      getProfileSummary: jest.fn().mockResolvedValue({
        userId: '15',
        nickname: '已登录用户',
        phoneBound: false,
        privacyAccepted: false,
      }),
    }
    const controller = new MiniappAuthController(authService as any, miniappService as any)

    const result = await controller.profile({
      user: { id: 15 },
      headers: { 'x-request-id': 'req-profile' },
    })

    expect(miniappService.getProfileSummary).toHaveBeenCalledWith(15)
    expect(result).toMatchObject({
      success: true,
      data: {
        userId: '15',
        nickname: '已登录用户',
      },
      meta: {
        requestId: 'req-profile',
        apiVersion: 'mini-v1',
      },
    })
  })
})
