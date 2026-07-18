export interface ApiResponseEnvelope<T = unknown> {
  code: number
  data: T
  errMsg: string
}

export class ApiResponseError extends Error {
  code: number
  payload: ApiResponseEnvelope<unknown>

  constructor(payload: ApiResponseEnvelope<unknown>) {
    super(payload.errMsg || '请求失败')
    this.name = 'ApiResponseError'
    this.code = payload.code
    this.payload = payload
  }
}

export const parseResponseEnvelope = (raw: unknown): ApiResponseEnvelope<unknown> => {
  if (typeof raw === 'string') {
    try {
      return parseResponseEnvelope(JSON.parse(raw))
    } catch {
      return {
        code: 50000,
        data: null,
        errMsg: raw,
      }
    }
  }

  if (
    typeof raw === 'object' &&
    raw !== null &&
    'code' in raw &&
    'data' in raw &&
    'errMsg' in raw
  ) {
    return raw as ApiResponseEnvelope<unknown>
  }

  return {
    code: 50000,
    data: null,
    errMsg: '请求失败',
  }
}

export const extractResponseData = <T>(payload: ApiResponseEnvelope<T>) => {
  if (payload.code === 0) {
    return payload.data
  }

  throw new ApiResponseError(payload as ApiResponseEnvelope<unknown>)
}
