export interface TableColumn {
  prop?: string
  label: string
  width?: number
  slot?: string
  type?: string
  link?: boolean | ((row: any) => string)
  linkParams?: any
  actionParams?: any
  fixed?: 'left' | 'right' | boolean
  align?: 'left' | 'center' | 'right'
  visible?: boolean
}

export interface DataTypeOption {
  code: string
  label: string
  placeholder?: string
  detailId?: string
}
