import type { MiniProfileSummaryDto } from '@gaoge/miniapp-api-contract'

export interface AuthState {
  accessToken: string | undefined
  accessTokenExpiresAt: number | undefined
  profile: MiniProfileSummaryDto | undefined
}

const AUTH_STORAGE_KEY = 'auth'

const authState: AuthState = {
  accessToken: undefined,
  accessTokenExpiresAt: undefined,
  profile: undefined,
}

export function getAuthState() {
  return authState
}

export function getAccessToken() {
  if (isAccessTokenExpired()) {
    clearAuthState()
    return undefined
  }

  return authState.accessToken
}

export function hasValidAccessToken() {
  return Boolean(getAccessToken())
}

export function setAuthState(nextState: Partial<AuthState>) {
  if ('accessToken' in nextState) {
    authState.accessToken = nextState.accessToken
  }

  if ('accessTokenExpiresAt' in nextState) {
    authState.accessTokenExpiresAt = nextState.accessTokenExpiresAt
  }

  if ('profile' in nextState) {
    authState.profile = nextState.profile
  }

  persistAuthState()
}

export function hydrateAuthState() {
  const storedState = wx.getStorageSync(AUTH_STORAGE_KEY) as Partial<AuthState> | undefined

  if (!storedState?.accessToken || !storedState.accessTokenExpiresAt) {
    clearAuthState()
    return
  }

  authState.accessToken = storedState.accessToken
  authState.accessTokenExpiresAt = storedState.accessTokenExpiresAt
  authState.profile = storedState.profile

  if (isAccessTokenExpired()) {
    clearAuthState()
  }
}

export function clearAuthState() {
  authState.accessToken = undefined
  authState.accessTokenExpiresAt = undefined
  authState.profile = undefined
  wx.removeStorageSync(AUTH_STORAGE_KEY)
}

function persistAuthState() {
  if (!authState.accessToken || !authState.accessTokenExpiresAt) {
    wx.removeStorageSync(AUTH_STORAGE_KEY)
    return
  }

  wx.setStorageSync(AUTH_STORAGE_KEY, {
    accessToken: authState.accessToken,
    accessTokenExpiresAt: authState.accessTokenExpiresAt,
    profile: authState.profile,
  })
}

function isAccessTokenExpired() {
  if (!authState.accessToken || !authState.accessTokenExpiresAt) {
    return true
  }

  return authState.accessTokenExpiresAt <= Date.now()
}
