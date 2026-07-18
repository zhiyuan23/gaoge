export interface MiniPaginationParams {
  page?: number
  pageSize?: number
}

export interface MiniPaginationMeta {
  page: number
  pageSize: number
  total: number
  hasMore: boolean
}

export interface MiniPageData<T> {
  list: T[]
  pagination: MiniPaginationMeta
}
