import type { AuthRoleSummary, UserStatus } from './auth.js'
import type { DateTimeString } from './common.js'

/**
 * 后台系统用户信息。
 *
 * @property id 用户 ID。
 * @property account 后台登录账号。
 * @property nickname 昵称。
 * @property avatarUrl 头像 URL。
 * @property roles 用户角色列表。
 * @property status 用户状态。
 * @property lastLoginAt 最近登录时间，未登录过时为 null。
 * @property createdAt 创建时间。
 * @property updatedAt 更新时间。
 */
export interface SystemUser {
  id: number
  account: string
  nickname: string | null
  avatarUrl: string | null
  roles: AuthRoleSummary[]
  status: UserStatus
  lastLoginAt: DateTimeString | null
  createdAt: DateTimeString
  updatedAt: DateTimeString
}

/** 系统用户列表查询参数。 */
export interface SystemUserListParams {
  page?: number | string
  pageSize?: number | string
  keyword?: string
  roleId?: number | string
  status?: UserStatus
}

/** 系统用户列表响应。 */
export interface SystemUserListResponse {
  list: SystemUser[]
  total: number
}

/**
 * 创建系统用户时的提交参数。
 *
 * @property account 后台登录账号。
 * @property password 初始登录密码。
 * @property nickname 昵称。
 * @property avatarUrl 头像 URL。
 * @property roleIds 用户角色 ID 列表。
 * @property status 用户状态。
 */
export interface CreateSystemUserPayload {
  account: string
  password: string
  nickname: string
  avatarUrl?: string
  roleIds: number[]
  status: UserStatus
}

/**
 * 更新系统用户时的提交参数。
 *
 * @property nickname 昵称。
 * @property avatarUrl 头像 URL。
 * @property roleIds 用户角色 ID 列表。
 */
export interface UpdateSystemUserPayload {
  nickname: string
  avatarUrl?: string
  roleIds: number[]
  status?: UserStatus
  expectedUpdatedAt: DateTimeString
}

/** 更新系统用户状态时的提交参数。 */
export interface UpdateSystemUserStatusPayload {
  status: UserStatus
  expectedUpdatedAt: DateTimeString
}

/** 重置系统用户密码时的提交参数。 */
export interface ResetSystemUserPasswordPayload {
  newPassword: string
  expectedUpdatedAt: DateTimeString
}
