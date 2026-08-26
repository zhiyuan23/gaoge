import type { SystemMenuType } from '@gaoge/shared-types'

export interface MenuConfigurationFormValue {
  expectedUpdatedAt?: string
  icon: string
  menuType: SystemMenuType
  name: string
  parentId: number | null
  path: string | null
  resourceIds: number[]
  routeName: string
  sort: number
  status: 'active' | 'inactive'
  title: string
  visible: boolean
}

export interface PermissionFormValue {
  action: string
  description: string
  name: string
  status: 'active' | 'inactive'
}
