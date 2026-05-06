import type { DateTimeString } from './common.js'

/** 用户角色。admin 可访问后台管理能力，viewer 只读访问，user 为普通用户。 */
export type UserRole = 'user' | 'admin' | 'viewer'

/** 用户账号状态。inactive 用户不可正常登录或访问受保护接口。 */
export type UserStatus = 'active' | 'inactive'

/**
 * 后台账号密码登录请求参数。
 *
 * @property account 后台登录账号。
 * @property password 后台登录密码。
 */
export interface AdminLoginPayload {
  account: string
  password: string
}

/**
 * 登录态用户信息，不包含 token 和密码哈希。
 *
 * @property id 用户 ID。
 * @property account 后台登录账号；微信用户可能为空字符串。
 * @property openid 微信 openid；后台账号可能为空。
 * @property nickname 昵称。
 * @property avatarUrl 头像 URL。
 * @property phone 手机号。
 * @property role 用户角色。
 * @property status 用户状态。
 * @property lastLoginAt 最近登录时间，未登录过时为 null。
 */
export interface AuthUser {
  id: number
  account: string
  openid: string | null
  nickname: string | null
  avatarUrl: string | null
  phone: string | null
  role: UserRole
  status: UserStatus
  lastLoginAt: DateTimeString | null
}

/**
 * 登录接口响应数据。
 *
 * @property user 当前登录用户。
 * @property accessToken 访问 token，用于 Authorization Bearer 认证。
 * @property refreshToken 刷新 token，用于换取新的访问 token。
 * @property expiresIn accessToken 有效期，单位为秒。
 */
export interface AuthLoginResponse {
  user: AuthUser
  accessToken: string
  refreshToken: string
  expiresIn: number
}

/** 后台登录响应数据，语义别名。 */
export type AdminLoginResponse = AuthLoginResponse

/**
 * 当前用户权限响应数据。
 *
 * @property permissions 权限标识列表，例如 player:create。
 * @property role 当前用户角色。
 */
export interface PermissionResponse {
  permissions: string[]
  role: UserRole
}
