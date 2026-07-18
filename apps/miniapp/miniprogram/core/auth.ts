import type { MiniProfileSummaryDto, MiniWechatLoginResponseDto } from '@gaoge/miniapp-api-contract'

import { MiniRoutes } from '../contracts/mini-api'
import { clearAuthState, hasValidAccessToken, setAuthState } from '../stores/auth.store'

import { requestMiniApi } from './http'

export async function silentLogin() {
  if (hasValidAccessToken()) {
    return true
  }

  try {
    const loginResult = await wxLogin()

    if (!loginResult.code) {
      return false
    }

    const result = await requestMiniApi<MiniWechatLoginResponseDto>({
      auth: 'public',
      data: { code: loginResult.code },
      method: 'POST',
      path: MiniRoutes.authWechatLogin,
    })

    if (!result.success) {
      return false
    }

    setAuthState({
      accessToken: result.data.accessToken,
      accessTokenExpiresAt: Date.now() + result.data.expiresIn * 1000,
      profile: result.data.profileSummary,
    })

    return true
  } catch {
    return false
  }
}

export async function ensureLogin() {
  return silentLogin()
}

export async function ensurePhoneBound(profile: MiniProfileSummaryDto | undefined) {
  return Boolean(profile?.phoneBound)
}

export async function ensurePrivacyAccepted(profile: MiniProfileSummaryDto | undefined) {
  return Boolean(profile?.privacyAccepted)
}

export async function refreshProfile() {
  const result = await requestMiniApi<MiniProfileSummaryDto>({
    auth: 'required',
    path: MiniRoutes.authProfile,
  })

  if (result.success) {
    setAuthState({ profile: result.data })
  }

  return result
}

export function logout() {
  clearAuthState()
}

function wxLogin() {
  return new Promise<WechatMiniprogram.LoginSuccessCallbackResult>((resolve, reject) => {
    wx.login({
      success: resolve,
      fail: reject,
    })
  })
}
