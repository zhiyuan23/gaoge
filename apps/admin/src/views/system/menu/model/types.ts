import type { SystemMenuType, UserStatus } from '@gaoge/shared-types'

export interface SystemMenuSearch {
  keyword: string
  menuType: '' | SystemMenuType
  status: '' | UserStatus
}

export interface SystemMenuFormModel {
  parentId: number | null
  name: string
  title: string
  icon: string
  path: string
  routeName: string
  menuType: SystemMenuType
  sort: number
  status: UserStatus
  visible: boolean
}
