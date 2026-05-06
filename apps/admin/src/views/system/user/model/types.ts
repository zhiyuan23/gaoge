import type { UserRole, UserStatus } from '@gaoge/shared-types'

export interface SystemUserSearch {
  keyword: string
  role: '' | UserRole
  status: '' | UserStatus
}

export interface SystemUserFormModel {
  account: string
  password: string
  nickname: string
  avatarUrl: string
  role: UserRole
  status: UserStatus
}

export interface ResetPasswordFormModel {
  newPassword: string
}
