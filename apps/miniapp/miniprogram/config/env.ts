export type MiniappEnvName = 'development' | 'production'

type MiniappEnvProfile = {
  env: MiniappEnvName
  apiBaseUrl: string
  defaultEventSeriesCode: string
  requestTimeout: number
}

const envProfiles: Record<MiniappEnvName, MiniappEnvProfile> = {
  development: {
    env: 'development',
    apiBaseUrl: 'http://127.0.0.1:3000',
    defaultEventSeriesCode: 'gaoge-super-league',
    requestTimeout: 10000,
  },
  production: {
    env: 'production',
    apiBaseUrl: 'https://api.gaoge.cc',
    defaultEventSeriesCode: 'gaoge-super-league',
    requestTimeout: 10000,
  },
}

export const MiniappEnv = envProfiles[resolveMiniappEnvName()]

export const MINIAPP_ENV = MiniappEnv.env

export const API_BASE_URL = MiniappEnv.apiBaseUrl

export const DEFAULT_EVENT_SERIES_CODE = MiniappEnv.defaultEventSeriesCode

export const REQUEST_TIMEOUT = MiniappEnv.requestTimeout

function resolveMiniappEnvName(): MiniappEnvName {
  const envVersion = wx.getAccountInfoSync().miniProgram.envVersion

  if (envVersion === 'release') {
    return 'production'
  }

  return 'development'
}
