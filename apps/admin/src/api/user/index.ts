import type {
  AdminLoginPayload,
  AdminLoginResponse,
  AuthUser,
  ChangePasswordPayload,
  ChangePasswordResponse,
  PermissionResponse,
  UpdateAuthProfilePayload,
} from '@gaoge/shared-types'

import api from '../index'

export type { AdminLoginResponse, AuthUser, PermissionResponse }

export default {
  // 登录
  login: (data: AdminLoginPayload) =>
    api.post<AdminLoginResponse>('auth/admin/login', data, {
      noAuth: true,
    }),

  profile: () => api.get<AuthUser>('auth/profile', { toast: false }),

  updateProfile: (data: UpdateAuthProfilePayload) => api.patch<AuthUser>('auth/profile', data),

  uploadAvatar: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    return api.post<AuthUser>('auth/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },

  changePassword: (data: ChangePasswordPayload) =>
    api.patch<ChangePasswordResponse>('auth/password', data),

  // 获取权限
  permission: () => api.get<PermissionResponse>('auth/permission', { toast: false }),

  logout: () => api.post('auth/logout', {}),

  // 修改密码
  passwordEdit: (data: { password: string; newPassword: string }) =>
    api.post('user/password/edit', data),
}
