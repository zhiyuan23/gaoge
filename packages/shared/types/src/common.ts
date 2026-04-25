/** ISO 8601 日期时间字符串，接口传输层统一使用字符串而不是 Date 对象。 */
export type DateTimeString = string

/** 通用分页元信息。 */
export interface Pagination {
  page: number
  pageSize: number
  total: number
}

/** 后端统一响应包裹结构。 */
export interface ApiEnvelope<T> {
  code: number
  data: T
  errMsg: string
}

/** monorepo 内应用描述信息，用于文档、工具或脚本识别应用角色。 */
export interface AppDescriptor {
  name: string
  runtime: 'node' | 'web' | 'miniapp'
}
