import type { UserStatus } from './auth.js'
import type { DateTimeString } from './common.js'

export type SystemMenuType = 'catalog' | 'menu'

export interface SystemMenu {
  id: number
  parentId: number | null
  name: string
  title: string
  icon: string | null
  path: string
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
  children: SystemMenu[]
  createdAt: DateTimeString
  updatedAt: DateTimeString
}

export interface CreateSystemMenuPayload {
  parentId?: number | null
  name: string
  title: string
  icon?: string
  path: string
  routeName: string
  menuType: SystemMenuType
  sort?: number
  status: UserStatus
  visible: boolean
}

export interface UpdateSystemMenuPayload {
  parentId?: number | null
  name: string
  title: string
  icon?: string
  path: string
  routeName: string
  menuType: SystemMenuType
  sort?: number
  status: UserStatus
  visible: boolean
}

export interface UpdateSystemMenuSortPayload {
  sort: number
}

export interface UpdateSystemMenuPermissionsPayload {
  permissionIds: number[]
}
