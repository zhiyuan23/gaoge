import type {
  AdminLoginPayload,
  AdminLoginResponse,
  AuthUser,
  PermissionResponse,
} from '@gaoge/shared-types'

import api from '../index'

export type { AdminLoginResponse, AuthUser, PermissionResponse }

export default {
  // 登录
  login: (data: AdminLoginPayload) =>
    api.post('auth/admin/login', data, {
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
