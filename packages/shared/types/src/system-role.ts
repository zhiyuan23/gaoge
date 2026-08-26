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
  resourceCount: number
  moduleCount: number
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
  permissionIds?: number[]
}

export interface UpdateSystemRolePayload {
  name: string
  description?: string
  status?: UserStatus
  sort?: number
  permissionIds?: number[]
  expectedUpdatedAt: DateTimeString
}

export interface UpdateSystemRoleStatusPayload {
  status: UserStatus
  expectedUpdatedAt: DateTimeString
}

export interface UpdateSystemRolePermissionsPayload {
  permissionIds: number[]
  expectedUpdatedAt: DateTimeString
}
