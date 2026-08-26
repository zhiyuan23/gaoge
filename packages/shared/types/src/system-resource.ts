import type { UserStatus } from './auth.js'
import type { DateTimeString } from './common.js'
import type { SystemMenu } from './system-menu.js'
import type { SystemPermission } from './system-permission.js'

export interface SystemResourceReference {
  id: number
  key: string
  name: string
  module: string
  status: UserStatus
}

export interface SystemResource extends SystemResourceReference {
  description: string | null
  sort: number
  isBuiltIn: boolean
  permissions: (SystemPermission & {
    roles: { id: number; code: string; name: string }[]
  })[]
  menus: { id: number; title: string; routeName: string }[]
  menuCount: number
  roles: { id: number; code: string; name: string }[]
  roleCount: number
  createdAt: DateTimeString
  updatedAt: DateTimeString
}

export interface SystemResourceListParams {
  keyword?: string
  module?: string
  status?: UserStatus
}

export interface CreateSystemResourcePayload {
  key: string
  name: string
  module: string
  description?: string
  sort?: number
  viewName?: string
  viewDescription?: string
}

export interface UpdateSystemResourcePayload {
  name: string
  module: string
  description?: string
  sort?: number
  expectedUpdatedAt: DateTimeString
}

export interface UpdateSystemResourceStatusPayload {
  status: UserStatus
  expectedUpdatedAt: DateTimeString
}

export interface SystemAccessCatalog {
  menus: SystemMenu[]
  resources: SystemResource[]
}

export interface SystemAuditActor {
  id: number
  account: string | null
  nickname: string | null
}

export interface SystemAuditEvent {
  id: string
  action: string
  result: string
  actor: SystemAuditActor | null
  entityType: string | null
  entityId: string | null
  requestId: string | null
  metadata: Record<string, unknown> | null
  createdAt: DateTimeString
}

export interface SystemAuditListParams {
  page?: number | string
  pageSize?: number | string
  action?: string
  result?: string
  entityType?: string
  entityId?: string
  requestId?: string
  from?: DateTimeString
  to?: DateTimeString
}

export interface SystemAuditListResponse {
  list: SystemAuditEvent[]
  total: number
  page: number
  pageSize: number
}
