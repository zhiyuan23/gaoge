import type { UserStatus } from '@gaoge/shared-types'

export interface SystemUserSearch {
  keyword: string
  roleId: '' | number
  status: '' | UserStatus
}

export interface SystemUserFormModel {
  account: string
  password: string
  nickname: string
  avatarUrl: string
  roleIds: number[]
  status: UserStatus
}

export interface ResetPasswordFormModel {
  newPassword: string
}
