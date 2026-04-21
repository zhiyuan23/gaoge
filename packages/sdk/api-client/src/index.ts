import type { ApiEnvelope } from '@gaoge/shared-types'

export interface ApiClient {
  baseURL: string
  get<T>(path: string): Promise<ApiEnvelope<T>>
}

export function createApiClient(baseURL: string): ApiClient {
  return {
    baseURL,
    async get<T>(path: string) {
      return {
        data: undefined as T,
        requestId: `${baseURL}:${path}`,
      }
    },
  }
}
