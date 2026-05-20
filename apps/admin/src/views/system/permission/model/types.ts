import type { UserStatus } from '@gaoge/shared-types'

export interface SystemPermissionSearch {
  keyword: string
  module: string
  status: '' | UserStatus
}

export interface SystemPermissionFormModel {
  code: string
  name: string
  description: string
  status: UserStatus
}
