import type {
  CreateSystemRolePayload,
  SystemPermission,
  SystemRole,
  UpdateSystemRolePayload,
  UpdateSystemRolePermissionsPayload,
  UpdateSystemRoleStatusPayload,
} from '@gaoge/shared-types'

import api from '@/api'

export type {
  CreateSystemRolePayload,
  SystemPermission,
  SystemRole,
  UpdateSystemRolePayload,
  UpdateSystemRolePermissionsPayload,
  UpdateSystemRoleStatusPayload,
}

export default {
  list: () => api.get<SystemRole[]>('/system/roles'),
  create: (data: CreateSystemRolePayload) => api.post<SystemRole>('/system/roles', data),
  update: (id: number, data: UpdateSystemRolePayload) =>
    api.patch<SystemRole>(`/system/roles/${id}`, data),
  updateStatus: (id: number, data: UpdateSystemRoleStatusPayload) =>
    api.patch<SystemRole>(`/system/roles/${id}/status`, data),
  permissions: (id: number) => api.get<SystemPermission[]>(`/system/roles/${id}/permissions`),
  updatePermissions: (id: number, data: UpdateSystemRolePermissionsPayload) =>
    api.patch<SystemPermission[]>(`/system/roles/${id}/permissions`, data),
  remove: (id: number) => api.delete<{ id: number }>(`/system/roles/${id}`),
}
