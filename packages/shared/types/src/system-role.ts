import type { UserStatus } from './auth.js'
import type { DateTimeString } from './common.js'

export interface SystemRole {
  id: number
  code: string
  name: string
  description: string | null
  status: UserStatus
  sort: number
  isBuiltIn: boolean
  permissionCount: number
  userCount: number
  createdAt: DateTimeString
  updatedAt: DateTimeString
}

export interface SystemRolePermissionGroup {
  module: string
  permissions: {
    id: number
    code: string
    name: string
    description: string | null
    status: UserStatus
  }[]
}

export interface CreateSystemRolePayload {
  code: string
  name: string
  description?: string
  status: UserStatus
  sort?: number
}

export interface UpdateSystemRolePayload {
  name: string
  description?: string
  status: UserStatus
  sort?: number
}

export interface UpdateSystemRoleStatusPayload {
  status: UserStatus
}

export interface UpdateSystemRolePermissionsPayload {
  permissionIds: number[]
}
