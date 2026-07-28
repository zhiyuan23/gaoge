import { getJson } from './api'

const WECHAT_SDK_SRC = 'https://res.wx.qq.com/open/js/jweixin-1.6.0.js'

function isWechatBrowser() {
  return /MicroMessenger/i.test(window.navigator.userAgent || '')
}

function normalizeCurrentUrl() {
  const currentUrl = new URL(window.location.href)
  currentUrl.hash = ''
  return currentUrl.toString()
}

function toAbsoluteUrl(value) {
  return new URL(value, window.location.origin).toString()
}

async function ensureWechatSdk() {
  if (window.wx) {
    return window.wx
  }

  const existingScript = document.querySelector(`script[src="${WECHAT_SDK_SRC}"]`)
  if (existingScript) {
    return new Promise((resolve, reject) => {
      existingScript.addEventListener('load', () => resolve(window.wx), { once: true })
      existingScript.addEventListener('error', () => reject(new Error('微信 JS-SDK 加载失败')), {
        once: true,
      })
    })
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = WECHAT_SDK_SRC
    script.async = true
    script.onload = () => resolve(window.wx)
    script.onerror = () => reject(new Error('微信 JS-SDK 加载失败'))
    document.head.appendChild(script)
  })
}

export async function syncWechatShare(route) {
  if (typeof window === 'undefined' || !isWechatBrowser()) {
    return
  }

  try {
    const wx = await ensureWechatSdk()
    const link = normalizeCurrentUrl()
    const shareConfig = await getJson('/wechat/share/public-config', {
      path: route.path,
    })
    const imgUrl = toAbsoluteUrl(shareConfig.imgUrl)
    const signature = await getJson('/wechat/share/jssdk-signature', {
      url: link,
    })

    wx.config({
      debug: false,
      appId: signature.appId,
      timestamp: signature.timestamp,
      nonceStr: signature.nonceStr,
      signature: signature.signature,
      jsApiList: ['updateAppMessageShareData', 'updateTimelineShareData'],
    })

    wx.ready(() => {
      wx.updateAppMessageShareData({
        ...shareConfig,
        imgUrl,
        link,
      })
      wx.updateTimelineShareData({
        title: shareConfig.title,
        imgUrl,
        link,
      })
    })
  } catch (error) {
    console.error('[Gaoge Web] 微信分享初始化失败', error)
  }
}
