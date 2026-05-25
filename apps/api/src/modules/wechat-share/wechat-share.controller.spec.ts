import { PATH_METADATA } from '@nestjs/common/constants'

import { WechatShareController } from './wechat-share.controller'

describe('WechatShareController', () => {
  it('uses the wechat share controller prefix', () => {
    expect(Reflect.getMetadata(PATH_METADATA, WechatShareController)).toBe('wechat/share')
  })

  it('maps getJssdkSignature to /wechat/share/jssdk-signature', () => {
    expect(
      Reflect.getMetadata(PATH_METADATA, WechatShareController.prototype.getJssdkSignature),
    ).toBe('jssdk-signature')
  })

  it('maps getAdminConfig to /wechat/share/admin-config', () => {
    expect(Reflect.getMetadata(PATH_METADATA, WechatShareController.prototype.getAdminConfig)).toBe(
      'admin-config',
    )
  })

  it('maps updateAdminConfig to /wechat/share/admin-config', () => {
    expect(
      Reflect.getMetadata(PATH_METADATA, WechatShareController.prototype.updateAdminConfig),
    ).toBe('admin-config')
  })

  it('maps getPublicConfig to /wechat/share/public-config', () => {
    expect(
      Reflect.getMetadata(PATH_METADATA, WechatShareController.prototype.getPublicConfig),
    ).toBe('public-config')
  })

  it('delegates the query url to the service', async () => {
    const service = {
      getAdminConfig: jest.fn().mockResolvedValue({
        appId: 'wx-official',
        hasAppSecret: true,
      }),
      updateAdminConfig: jest.fn().mockResolvedValue({
        appId: 'wx-official',
        hasAppSecret: true,
      }),
      getPublicConfig: jest.fn().mockResolvedValue({
        title: '球队标题',
        desc: '球队简介',
        imgUrl: 'https://cdn.gaoge.cc/team.png',
      }),
      getJssdkSignature: jest.fn().mockResolvedValue({
        appId: 'wx-official',
        timestamp: 1716530000,
        nonceStr: 'nonce-string',
        signature: 'signature-value',
      }),
    }
    const controller = new WechatShareController(service as any)

    await expect(
      controller.getJssdkSignature({
        url: 'https://gaoge.cc/teams/football',
      }),
    ).resolves.toEqual({
      appId: 'wx-official',
      timestamp: 1716530000,
      nonceStr: 'nonce-string',
      signature: 'signature-value',
    })

    expect(service.getJssdkSignature).toHaveBeenCalledWith('https://gaoge.cc/teams/football')
  })

  it('delegates admin config reads and writes to the service', async () => {
    const service = {
      getAdminConfig: jest.fn().mockResolvedValue({
        appId: 'wx-official',
        hasAppSecret: true,
      }),
      updateAdminConfig: jest.fn().mockResolvedValue({
        appId: 'wx-official',
        hasAppSecret: true,
      }),
      getPublicConfig: jest.fn(),
      getJssdkSignature: jest.fn(),
    }
    const controller = new WechatShareController(service as any)

    await expect(controller.getAdminConfig()).resolves.toEqual({
      appId: 'wx-official',
      hasAppSecret: true,
    })

    await expect(
      controller.updateAdminConfig({
        appId: 'wx-updated',
        appSecret: '',
      } as any),
    ).resolves.toEqual({
      appId: 'wx-official',
      hasAppSecret: true,
    })

    expect(service.getAdminConfig).toHaveBeenCalled()
    expect(service.updateAdminConfig).toHaveBeenCalledWith({
      appId: 'wx-updated',
      appSecret: '',
    })
  })

  it('delegates public config reads to the service', async () => {
    const service = {
      getAdminConfig: jest.fn(),
      updateAdminConfig: jest.fn(),
      getPublicConfig: jest.fn().mockResolvedValue({
        title: '球队标题',
        desc: '球队简介',
        imgUrl: 'https://cdn.gaoge.cc/team.png',
      }),
      getJssdkSignature: jest.fn(),
    }
    const controller = new WechatShareController(service as any)

    await expect(
      controller.getPublicConfig({
        path: '/teams/football',
      } as any),
    ).resolves.toEqual({
      title: '球队标题',
      desc: '球队简介',
      imgUrl: 'https://cdn.gaoge.cc/team.png',
    })

    expect(service.getPublicConfig).toHaveBeenCalledWith('/teams/football')
  })
})
