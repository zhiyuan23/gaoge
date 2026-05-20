import type {
  CreateSystemPermissionPayload,
  GroupedSystemPermissionResponse,
  SystemPermission,
  SystemPermissionListParams,
  UpdateSystemPermissionPayload,
} from '@gaoge/shared-types'

import api from '@/api'

export type {
  CreateSystemPermissionPayload,
  GroupedSystemPermissionResponse,
  SystemPermission,
  SystemPermissionListParams,
  UpdateSystemPermissionPayload,
}

export default {
  list: (params?: SystemPermissionListParams) =>
    api.get<SystemPermission[]>('/system/permissions', { params }),
  grouped: () => api.get<GroupedSystemPermissionResponse>('/system/permissions/grouped'),
  create: (data: CreateSystemPermissionPayload) =>
    api.post<SystemPermission>('/system/permissions', data),
  update: (id: number, data: UpdateSystemPermissionPayload) =>
    api.patch<SystemPermission>(`/system/permissions/${id}`, data),
  remove: (id: number) => api.delete<{ id: number }>(`/system/permissions/${id}`),
  syncBuiltIns: () => api.post('/system/permissions/sync-builtins', {}),
}
