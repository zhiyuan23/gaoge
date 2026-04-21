import api from '../index'

export interface LoginPayload {
  account: string
  password: string
}

export interface AuthUser {
  id: number
  account: string
  openid: string | null
  nickname: string | null
  avatarUrl: string | null
  phone: string | null
  role: string
  status: string
  lastLoginAt: string | null
}

export interface LoginResponse {
  user: AuthUser
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface PermissionResponse {
  permissions: string[]
  role: string
}

export default {
  // 登录
  login: (data: LoginPayload) =>
    api.post('auth/admin-login', data, {
      noAuth: true,
    }),

  profile: () => api.get('auth/profile'),

  // 获取权限
  permission: () => api.get('auth/permission'),

  logout: () => api.post('auth/logout', {}),

  // 修改密码
  passwordEdit: (data: { password: string; newPassword: string }) =>
    api.post('user/password/edit', data),
}
