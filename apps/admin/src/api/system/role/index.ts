import type {
  CreateSystemRolePayload,
  SystemPermission,
  SystemRole,
  SystemRoleComparison,
  SystemRoleMenuNode,
  SystemRolePermissionModule,
  SystemRoleRelatedUser,
  SystemRoleWorkspaceDetail,
  UpdateSystemRoleMenuAccessPayload,
  UpdateSystemRolePayload,
  UpdateSystemRolePermissionsPayload,
  UpdateSystemRoleStatusPayload,
  UpdateSystemRoleWorkspacePayload,
} from '@gaoge/shared-types'

import api from '@/api'

export type {
  CreateSystemRolePayload,
  SystemPermission,
  SystemRole,
  SystemRoleComparison,
  SystemRoleMenuNode,
  SystemRolePermissionModule,
  SystemRoleRelatedUser,
  SystemRoleWorkspaceDetail,
  UpdateSystemRoleMenuAccessPayload,
  UpdateSystemRolePayload,
  UpdateSystemRolePermissionsPayload,
  UpdateSystemRoleStatusPayload,
  UpdateSystemRoleWorkspacePayload,
}

export default {
  list: () => api.get<SystemRole[]>('/system/roles'),
  create: (data: CreateSystemRolePayload) => api.post<SystemRole>('/system/roles', data),
  update: (id: number, data: UpdateSystemRolePayload) =>
    api.patch<SystemRole>(`/system/roles/${id}`, data),
  updateStatus: (id: number, data: UpdateSystemRoleStatusPayload) =>
    api.patch<SystemRole>(`/system/roles/${id}/status`, data),
  detail: (id: number) => api.get<SystemRoleWorkspaceDetail>(`/system/roles/${id}/detail`),
  compare: (id: number, targetRoleId: number) =>
    api.get<SystemRoleComparison>(`/system/roles/${id}/compare/${targetRoleId}`),
  permissions: (id: number) => api.get<SystemPermission[]>(`/system/roles/${id}/permissions`),
  updateMenuAccess: (id: number, data: UpdateSystemRoleMenuAccessPayload) =>
    api.patch<SystemRoleWorkspaceDetail>(`/system/roles/${id}/menu-access`, data),
  updatePermissions: (id: number, data: UpdateSystemRolePermissionsPayload) =>
    api.patch<SystemPermission[]>(`/system/roles/${id}/permissions`, data),
  saveWorkspace: (id: number, data: UpdateSystemRoleWorkspacePayload) =>
    api.patch<SystemRoleWorkspaceDetail>(`/system/roles/${id}/workspace`, data),
  remove: (id: number) => api.delete<{ id: number }>(`/system/roles/${id}`),
}
