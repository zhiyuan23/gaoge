import { API_BASE_URL, REQUEST_TIMEOUT } from '../config/env'
import { MINIAPP_PLATFORM, MINIAPP_VERSION } from '../config/version'
import {
  MINI_API_VERSION,
  type MiniApiMeta,
  type MiniApiResult,
  MiniErrorCode,
} from '../contracts/mini-api'
import { getAccessToken } from '../stores/auth.store'

import { createNetworkError } from './error'
import { endPerformanceMark, startPerformanceMark } from './performance'

export type AuthMode = 'public' | 'optional' | 'required'

type RequestData = WechatMiniprogram.IAnyObject | string | ArrayBuffer

export interface HttpRequestOptions<TData extends RequestData = RequestData> {
  path: string
  method?: WechatMiniprogram.RequestOption['method']
  data?: TData
  auth?: AuthMode
  timeout?: number
}

export async function requestMiniApi<TResponse, TData extends RequestData = RequestData>(
  options: HttpRequestOptions<TData>,
): Promise<MiniApiResult<TResponse>> {
  const requestId = createRequestId()
  const token = getAccessToken()
  const auth = options.auth ?? 'public'

  if (auth === 'required' && !token) {
    return {
      success: false,
      error: {
        code: MiniErrorCode.Unauthorized,
        message: '请先登录',
      },
      meta: createLocalMeta(requestId),
    }
  }

  const mark = startPerformanceMark(`api:${options.path}`)

  try {
    const result = await runWxRequest<TResponse, TData>(options, requestId, token)
    endPerformanceMark(mark)
    return result
  } catch (_error) {
    endPerformanceMark(mark)

    return {
      success: false,
      error: createNetworkError(),
      meta: createLocalMeta(requestId),
    }
  }
}

function runWxRequest<TResponse, TData extends RequestData>(
  options: HttpRequestOptions<TData>,
  requestId: string,
  token: string | undefined,
) {
  return new Promise<MiniApiResult<TResponse>>((resolve, reject) => {
    const requestOptions: WechatMiniprogram.RequestOption<MiniApiResult<TResponse>> = {
      header: createHeaders(requestId, token),
      method: options.method ?? 'GET',
      timeout: options.timeout ?? REQUEST_TIMEOUT,
      url: `${API_BASE_URL}${options.path}`,
      success(response) {
        resolve(response.data)
      },
      fail(error) {
        reject(error)
      },
    }

    if (options.data !== undefined) {
      requestOptions.data = options.data
    }

    wx.request<MiniApiResult<TResponse>>(requestOptions)
  })
}

function createHeaders(requestId: string, token: string | undefined) {
  const headers: Record<string, string> = {
    'X-Request-Id': requestId,
    'X-Miniapp-Platform': MINIAPP_PLATFORM,
    'X-Miniapp-Version': MINIAPP_VERSION,
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return headers
}

function createLocalMeta(requestId: string): MiniApiMeta {
  return {
    apiVersion: MINI_API_VERSION,
    requestId,
    serverTime: new Date().toISOString(),
  }
}

function createRequestId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}
