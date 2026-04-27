export interface TableAction {
  key: string
  label: string
  auth?: string | string[]
  type?: 'primary' | 'success' | 'warning' | 'info' | 'danger'
  visible?: boolean | ((row: any) => boolean)
  disabled?: boolean | ((row: any) => boolean)
}

export interface TableColumn {
  prop?: string
  label: string
  width?: number
  slot?: string
  type?: string
  link?: boolean | ((row: any) => string)
  linkParams?: any
  actionParams?: any
  actions?: TableAction[]
  fixed?: 'left' | 'right' | boolean
  align?: 'left' | 'center' | 'right'
  visible?: boolean
}

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
  (e: 'actionClick', payload: any): void
}
