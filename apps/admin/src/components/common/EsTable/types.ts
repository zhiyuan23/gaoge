/**
 * 表格尺寸
 */
export type TableSize = '' | 'large' | 'default' | 'small'

/**
 * 分页参数
 */
export interface PaginationParams {
  page: number
  pageSize: number
}

/**
 * 表格 Props 类型（对外使用）
 */
export interface EsTableProps {
  columns: any[]
  data?: any[]
  showIndex?: boolean
  showPagination?: boolean
  total?: number
  page?: number
  pageSize?: number
  pageSizes?: number[]
  paginationLayout?: string
  background?: boolean
  border?: boolean
  tableSize?: TableSize
  tableHeight?: string | number
  maxHeight?: string | number
  loading?: boolean
}

/**
 * 表格 Emits 类型
 */
export interface EsTableEmits {
  (e: 'update:page', page: number): void
  (e: 'update:pageSize', pageSize: number): void
  (e: 'paginationChange', params: PaginationParams): void
  (e: 'linkClick', payload: any): void
}
