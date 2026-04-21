export interface Pagination {
  page: number
  pageSize: number
  total: number
}

export interface ApiEnvelope<T> {
  data: T
  requestId: string
}

export interface AppDescriptor {
  name: string
  runtime: 'node' | 'web' | 'miniapp'
}
