import type { UserStatus } from '@gaoge/shared-types'

export interface SystemRoleSearch {
  keyword: string
  status: '' | UserStatus
}

export interface SystemRoleFormModel {
  code: string
  name: string
  description: string
  status: UserStatus
  sort: number
}
