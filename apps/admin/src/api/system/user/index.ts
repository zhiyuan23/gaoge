import type {
  CreateSystemUserPayload,
  ResetSystemUserPasswordPayload,
  SystemUser,
  SystemUserListParams,
  SystemUserListResponse,
  UpdateSystemUserPayload,
  UpdateSystemUserStatusPayload,
} from '@gaoge/shared-types'

import api from '@/api'

export type {
  CreateSystemUserPayload,
  ResetSystemUserPasswordPayload,
  SystemUser,
  SystemUserListParams,
  SystemUserListResponse,
  UpdateSystemUserPayload,
  UpdateSystemUserStatusPayload,
}

export default {
  list: (params?: SystemUserListParams) =>
    api.get<SystemUserListResponse>('/system/users', { params }),
  create: (data: CreateSystemUserPayload) => api.post<SystemUser>('/system/users', data),
  update: (id: number, data: UpdateSystemUserPayload) =>
    api.patch<SystemUser>(`/system/users/${id}`, data),
  updateStatus: (id: number, data: UpdateSystemUserStatusPayload) =>
    api.patch<SystemUser>(`/system/users/${id}/status`, data),
  resetPassword: (id: number, data: ResetSystemUserPasswordPayload) =>
    api.patch<SystemUser>(`/system/users/${id}/reset-password`, data),
  remove: (id: number) => api.delete<SystemUser>(`/system/users/${id}`),
}
