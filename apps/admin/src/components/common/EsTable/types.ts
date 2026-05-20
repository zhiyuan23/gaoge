export interface TableAction {
  key: string
  label: string
  auth?: string | string[]
  icon?: string
  type?: 'primary' | 'success' | 'warning' | 'info' | 'danger'
  visible?: boolean | ((row: any) => boolean)
  disabled?: boolean | ((row: any) => boolean)
}

export interface TableColumn {
  prop?: string
  label: string
  /**
   * 默认列宽语义：最小宽度。
   * 旧配置里大量使用 width 表达“建议宽度”，这里继续兼容该写法。
   */
  width?: number
  minWidth?: number
  /**
   * 需要严格固定列宽时使用，对应 Element Plus 的 width。
   */
  fixedWidth?: number
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
  showSelection?: boolean
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
  (e: 'selectionChange', rows: any[]): void
  (e: 'linkClick', payload: any): void
  (e: 'actionClick', payload: any): void
}
