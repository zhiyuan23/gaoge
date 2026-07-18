import type { MiniErrorCode } from './errors'
import type { MiniApiVersion } from './version'

export type MiniApiResult<T> = MiniApiSuccess<T> | MiniApiFailure

export interface MiniApiSuccess<T> {
  success: true
  data: T
  meta: MiniApiMeta
}

export interface MiniApiFailure {
  success: false
  error: MiniApiError
  meta: MiniApiMeta
}

export interface MiniApiMeta {
  requestId: string
  serverTime: string
  apiVersion: MiniApiVersion
}

export interface MiniApiError {
  code: MiniErrorCode
  message: string
  traceId?: string
}
