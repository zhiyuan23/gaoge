import type {
  BatchSystemUserRolesPayload,
  CreateSystemUserPayload,
  ResetSystemUserPasswordPayload,
  SystemUser,
  SystemUserListParams,
  SystemUserListResponse,
  SystemUserPermissionExplanation,
  UpdateSystemUserPayload,
  UpdateSystemUserStatusPayload,
} from '@gaoge/shared-types'

import api from '@/api'

export type {
  BatchSystemUserRolesPayload,
  CreateSystemUserPayload,
  ResetSystemUserPasswordPayload,
  SystemUser,
  SystemUserListParams,
  SystemUserListResponse,
  SystemUserPermissionExplanation,
  UpdateSystemUserPayload,
  UpdateSystemUserStatusPayload,
}

export default {
  list: (params?: SystemUserListParams) =>
    api.get<SystemUserListResponse>('/system/users', { params }),
  create: (data: CreateSystemUserPayload) => api.post<SystemUser>('/system/users', data),
  batchUpdateRoles: (data: BatchSystemUserRolesPayload) =>
    api.patch<BatchSystemUserRolesPayload>('/system/users/batch/roles', data),
  permissionExplanation: (id: number) =>
    api.get<SystemUserPermissionExplanation>(`/system/users/${id}/permission-explanation`),
  update: (id: number, data: UpdateSystemUserPayload) =>
    api.patch<SystemUser>(`/system/users/${id}`, data),
  updateStatus: (id: number, data: UpdateSystemUserStatusPayload) =>
    api.patch<SystemUser>(`/system/users/${id}/status`, data),
  resetPassword: (id: number, data: ResetSystemUserPasswordPayload) =>
    api.patch<SystemUser>(`/system/users/${id}/reset-password`, data),
  remove: (id: number) => api.delete<SystemUser>(`/system/users/${id}`),
}
