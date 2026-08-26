import type { SystemMenuType } from './admin-navigation.js'
import type { UserStatus } from './auth.js'
import type { DateTimeString } from './common.js'

export type { SystemMenuType } from './admin-navigation.js'

export interface SystemMenu {
  id: number
  parentId: number | null
  name: string
  title: string
  icon: string | null
  path: string | null
  routeName: string
  menuType: SystemMenuType
  sort: number
  status: UserStatus
  visible: boolean
  isBuiltIn: boolean
  permissions: {
    id: number
    code: string
    name: string
  }[]
  resources: {
    id: number
    key: string
    name: string
    module: string
    status: UserStatus
  }[]
  children: SystemMenu[]
  createdAt: DateTimeString
  updatedAt: DateTimeString
}

export interface CreateSystemMenuPayload {
  parentId?: number | null
  name: string
  title: string
  icon?: string
  path: string | null
  routeName: string
  menuType: SystemMenuType
  sort?: number
  status: UserStatus
  visible: boolean
  resourceIds?: number[]
}

export interface UpdateSystemMenuPayload {
  parentId?: number | null
  name: string
  title: string
  icon?: string
  path: string | null
  routeName: string
  menuType: SystemMenuType
  sort?: number
  status: UserStatus
  visible: boolean
  resourceIds?: number[]
  expectedUpdatedAt: DateTimeString
}

export interface UpdateSystemMenuSortPayload {
  sort: number
}

export interface UpdateSystemMenuPermissionsPayload {
  permissionIds: number[]
  expectedUpdatedAt: DateTimeString
}

export interface UpdateSystemMenuResourcesPayload {
  resourceIds: number[]
  expectedUpdatedAt: DateTimeString
}
