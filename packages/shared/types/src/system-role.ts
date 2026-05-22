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

export interface SystemRoleMenuNode {
  id: number
  parentId: number | null
  name: string
  title: string
  path: string
  routeName: string
  menuType: 'catalog' | 'menu'
  status: UserStatus
  visible: boolean
  isBuiltIn: boolean
  permissionIds: number[]
  checked: boolean
  indeterminate: boolean
  children: SystemRoleMenuNode[]
}

export interface SystemRolePermissionItem {
  id: number
  code: string
  name: string
  action: string
  description: string | null
  status: UserStatus
  isBuiltIn: boolean
  checked: boolean
}

export interface SystemRolePermissionResourceGroup {
  resource: string
  label: string
  selectedCount: number
  permissions: SystemRolePermissionItem[]
}

export interface SystemRolePermissionModule {
  module: string
  label: string
  resources: SystemRolePermissionResourceGroup[]
}

export interface SystemRoleRelatedUser {
  id: number
  account: string
  nickname: string | null
  avatarUrl: string | null
  status: UserStatus
  roleCount: number
  roles: {
    id: number
    code: string
    name: string
    status: UserStatus
  }[]
  lastLoginAt: DateTimeString | null
}

export interface SystemRoleWorkspaceDetail {
  role: SystemRole
  menuTree: SystemRoleMenuNode[]
  menuPermissionGroups: Record<number, SystemRolePermissionModule[]>
  globalPermissionGroups: SystemRolePermissionModule[]
  relatedUsers: SystemRoleRelatedUser[]
}

export interface SystemRoleComparisonItem {
  key: string
  label: string
}

export interface SystemRoleComparison {
  leftRole: SystemRole
  rightRole: SystemRole
  menuDiff: {
    added: SystemRoleComparisonItem[]
    removed: SystemRoleComparisonItem[]
  }
  permissionDiff: {
    added: SystemRoleComparisonItem[]
    removed: SystemRoleComparisonItem[]
  }
  userDiff: {
    added: SystemRoleComparisonItem[]
    removed: SystemRoleComparisonItem[]
  }
}

export interface UpdateSystemRoleMenuAccessPayload {
  menuIds: number[]
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

export interface UpdateSystemRoleWorkspacePayload {
  menuIds: number[]
  menuPermissionIdsByMenu: Record<number, number[]>
  globalPermissionIds?: number[]
}
