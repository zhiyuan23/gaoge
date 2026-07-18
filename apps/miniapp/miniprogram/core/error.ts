import { type MiniErrorCode, MiniErrorCode as MiniErrorCodes } from '../contracts/mini-api'

export interface NormalizedMiniError {
  code: MiniErrorCode
  message: string
  traceId?: string
}

export function createNetworkError(): NormalizedMiniError {
  return {
    code: MiniErrorCodes.NetworkUnstable,
    message: '网络不稳定，请稍后重试',
  }
}
