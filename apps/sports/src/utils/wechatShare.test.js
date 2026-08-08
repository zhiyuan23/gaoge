import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import * as api from './api'
import { syncWechatShare } from './wechatShare'

vi.mock('./api', () => ({
  getJson: vi.fn(),
}))

const mockWx = {
  config: vi.fn(),
  ready: vi.fn((callback) => callback()),
  updateAppMessageShareData: vi.fn(),
  updateTimelineShareData: vi.fn(),
}

describe('syncWechatShare', () => {
  let consoleErrorSpy

  beforeEach(() => {
    vi.clearAllMocks()
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    window.wx = mockWx
    window.history.replaceState({}, '', '/teams/football#ranking')
    Object.defineProperty(window.navigator, 'userAgent', {
      configurable: true,
      value: 'Mozilla/5.0 MicroMessenger',
    })
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
    delete window.wx
  })

  it('skips initialization outside the wechat browser', async () => {
    Object.defineProperty(window.navigator, 'userAgent', {
      configurable: true,
      value: 'Mozilla/5.0 Safari',
    })

    await syncWechatShare({
      path: '/',
      fullPath: '/',
    })

    expect(api.getJson).not.toHaveBeenCalled()
    expect(mockWx.config).not.toHaveBeenCalled()
  })

  it('requests a signature and sets route-specific share data for the teams page', async () => {
    api.getJson
      .mockResolvedValueOnce({
        title: '球队标题',
        desc: '球队简介',
        imgUrl: 'https://cdn.gaoge.cc/teams.png',
      })
      .mockResolvedValueOnce({
        appId: 'wx-official',
        timestamp: 1716530000,
        nonceStr: 'nonce-value',
        signature: 'signature-value',
      })

    window.history.replaceState({}, '', '/')

    await syncWechatShare({ path: '/', fullPath: '/' })

    expect(api.getJson).toHaveBeenNthCalledWith(1, '/wechat/share/public-config', {
      path: '/teams',
    })
    expect(api.getJson).toHaveBeenNthCalledWith(2, '/wechat/share/jssdk-signature', {
      url: 'http://localhost:3000/',
    })
    expect(mockWx.config).toHaveBeenCalledWith(
      expect.objectContaining({
        appId: 'wx-official',
        timestamp: 1716530000,
        nonceStr: 'nonce-value',
        signature: 'signature-value',
        jsApiList: ['updateAppMessageShareData', 'updateTimelineShareData'],
      }),
    )
    expect(mockWx.updateAppMessageShareData).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '球队标题',
        desc: '球队简介',
        link: 'http://localhost:3000/',
        imgUrl: 'https://cdn.gaoge.cc/teams.png',
      }),
    )
    expect(mockWx.updateTimelineShareData).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '球队标题',
        link: 'http://localhost:3000/',
        imgUrl: 'https://cdn.gaoge.cc/teams.png',
      }),
    )
  })

  it('uses the former home metadata for the hero route', async () => {
    api.getJson
      .mockResolvedValueOnce({
        title: '品牌标题',
        desc: '品牌简介',
        imgUrl: 'https://cdn.gaoge.cc/hero.png',
      })
      .mockResolvedValueOnce({
        appId: 'wx-official',
        timestamp: 1716530000,
        nonceStr: 'nonce-value',
        signature: 'signature-value',
      })
    window.history.replaceState({}, '', '/hero')

    await syncWechatShare({ path: '/hero', fullPath: '/hero' })

    expect(api.getJson).toHaveBeenNthCalledWith(1, '/wechat/share/public-config', {
      path: '/',
    })
  })

  it('uses the asset-page metadata for /assets', async () => {
    api.getJson
      .mockResolvedValueOnce({
        title: '资产标题',
        desc: '资产简介',
        imgUrl: 'https://cdn.gaoge.cc/default.png',
      })
      .mockResolvedValueOnce({
        appId: 'wx-official',
        timestamp: 1716530000,
        nonceStr: 'nonce-value',
        signature: 'signature-value',
      })
    window.history.replaceState({}, '', '/assets')

    await syncWechatShare({
      path: '/assets',
      fullPath: '/assets',
    })

    expect(api.getJson).toHaveBeenNthCalledWith(1, '/wechat/share/public-config', {
      path: '/teams/football/assets',
    })

    expect(mockWx.updateAppMessageShareData).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '资产标题',
        imgUrl: 'https://cdn.gaoge.cc/default.png',
      }),
    )
  })

  it('swallows backend config errors so the page can keep rendering', async () => {
    api.getJson.mockRejectedValueOnce(new Error('missing config'))

    await expect(
      syncWechatShare({
        path: '/',
        fullPath: '/',
      }),
    ).resolves.toBeUndefined()

    expect(mockWx.config).not.toHaveBeenCalled()
    expect(console.error).toHaveBeenCalledWith('[Gaoge Web] 微信分享初始化失败', expect.any(Error))
  })
})
