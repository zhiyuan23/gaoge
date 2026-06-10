import { refreshTokenReq } from '@/api/auth'
import { type ApiResponseEnvelope, ApiResponseError, parseResponseEnvelope } from '@/api/response'
import { Loading, storage, Toast } from '@/utils'

type RequestMethod = 'GET' | 'POST' | 'UPLOAD' | 'DOWNLOAD'

interface RequestOption {
  timeout?: number
  header?: Record<string, string>
  loading?: boolean
  toast?: boolean
  json?: boolean
  skipAuth?: boolean
  skipRefresh?: boolean
  filePath?: string
  name?: string
}

interface InternalRequestConfig extends RequestOption {
  url: string
  method: RequestMethod
  data?: any
  filePath?: string
  name?: string
  retryAttempted?: boolean
}

const defaultTimeout = 10000
let refreshPromise: Promise<string | null> | null = null

const normalizeBaseUrl = () => {
  let baseURL = import.meta.env.VITE_API_BASE_URL

  // #ifdef H5
  if (import.meta.env.VITE_APP_PROXY === 'true') {
    baseURL = import.meta.env.VITE_API_PREFIX
  }
  // #endif

  return baseURL
}

const createHeaders = (config: InternalRequestConfig) => {
  const token = storage.get('accessToken')
  const authHeaders = config.skipAuth || !token ? {} : { Authorization: `Bearer ${token}` }

  const headers: Record<string, string> =
    config.method === 'UPLOAD'
      ? {
          ...authHeaders,
          ...(config.header || {}),
        }
      : {
          'content-type': config.json
            ? 'application/json;charset=UTF-8'
            : 'application/x-www-form-urlencoded',
          ...authHeaders,
          ...(config.header || {}),
        }

  return headers
}

const refreshAccessToken = async () => {
  const refreshToken = storage.get('refreshToken')

  if (!refreshToken) {
    return null
  }

  if (!refreshPromise) {
    refreshPromise = refreshTokenReq(refreshToken)
      .then((payload) => {
        storage.set('accessToken', payload.accessToken)
        storage.set('refreshToken', payload.refreshToken)
        storage.syncAuthState({
          accessToken: payload.accessToken,
          refreshToken: payload.refreshToken,
        })

        return payload.accessToken
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

const requestCore = async <T = any>(config: InternalRequestConfig): Promise<T> => {
  const shouldShowLoading = config.loading && !config.retryAttempted

  if (shouldShowLoading) {
    Loading.show()
  }

  const baseURL = normalizeBaseUrl()
  const headers = createHeaders(config)
  const timeout = config.timeout ?? defaultTimeout

  try {
    let response: any

    if (config.method === 'UPLOAD') {
      response = await new Promise<UniApp.UploadFileSuccessCallbackResult>((resolve, reject) => {
        uni.uploadFile({
          url: `${baseURL}${config.url}`,
          filePath: config.filePath || '',
          name: config.name || 'file',
          formData: config.data,
          header: headers,
          timeout,
          success: resolve,
          fail: reject,
        })
      })
    } else if (config.method === 'DOWNLOAD') {
      response = await new Promise<UniApp.DownloadSuccessData>((resolve, reject) => {
        uni.downloadFile({
          url: `${baseURL}${config.url}`,
          timeout,
          success: resolve,
          fail: reject,
        })
      })
    } else {
      const method = config.method as 'GET' | 'POST'
      response = await new Promise<UniApp.RequestSuccessCallbackResult>((resolve, reject) => {
        uni.request({
          url: `${baseURL}${config.url}`,
          method,
          data: config.data,
          header: headers,
          timeout,
          success: resolve,
          fail: reject,
        })
      })
    }

    const resData = parseResponseEnvelope((response as any).data) as ApiResponseEnvelope<T>

    if (resData.code === 0) {
      return resData.data
    }

    if (resData.code === 401 && !config.skipRefresh && !config.retryAttempted) {
      try {
        const nextAccessToken = await refreshAccessToken()

        if (nextAccessToken) {
          return requestCore<T>({
            ...config,
            retryAttempted: true,
          })
        }
      } catch {
        storage.clearAuth()
      }

      storage.clearAuth()
      if (config.toast !== false) {
        Toast('登录超时，请重新登录')
      }

      return Promise.reject(new ApiResponseError(resData))
    }

    if (config.toast !== false) {
      Toast(resData.errMsg || '请求失败')
    }

    return Promise.reject(new ApiResponseError(resData))
  } catch (err: any) {
    if (err instanceof ApiResponseError) {
      return Promise.reject(err)
    }

    if (config.toast !== false) {
      Toast('网络开小差了')
    }
    return Promise.reject(err)
  } finally {
    if (shouldShowLoading) {
      Loading.hide()
    }
  }
}

const request = <T = any>(
  url: string,
  method: RequestMethod,
  data?: any,
  options?: RequestOption,
): Promise<T> => {
  return requestCore<T>({
    url,
    method,
    data,
    ...options,
  })
}

export const upload = <T = any>(url: string, data?: any, options?: RequestOption): Promise<T> =>
  request<T>(url, 'UPLOAD', data, options)

export const download = <T = any>(url: string, data?: any, options?: RequestOption): Promise<T> =>
  request<T>(url, 'DOWNLOAD', data, options)

export const get = <T = any>(url: string, params?: any, options?: RequestOption): Promise<T> =>
  request<T>(url, 'GET', params, options)

export const post = <T = any>(url: string, data: any = {}, options?: RequestOption): Promise<T> =>
  request<T>(url, 'POST', data, options)

export const jsonPost = <T = any>(
  url: string,
  data: any = {},
  options?: RequestOption,
): Promise<T> => request<T>(url, 'POST', data, { ...options, json: true })

const api = {
  get,
  post,
  jsonPost,
  upload,
  download,
}

export default api
