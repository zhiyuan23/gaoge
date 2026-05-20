import type { UserStatus } from './auth.js'
import type { DateTimeString } from './common.js'

export interface SystemPermission {
  id: number
  code: string
  name: string
  module: string
  resource: string
  action: string
  description: string | null
  status: UserStatus
  isBuiltIn: boolean
  createdAt: DateTimeString
  updatedAt: DateTimeString
}

export interface SystemPermissionListParams {
  keyword?: string
  module?: string
  status?: UserStatus
}

export interface CreateSystemPermissionPayload {
  code: string
  name: string
  description?: string
  status: UserStatus
}

export interface UpdateSystemPermissionPayload {
  name: string
  description?: string
  status: UserStatus
}

export interface GroupedSystemPermissionResponse {
  groups: {
    module: string
    permissions: SystemPermission[]
  }[]
}
