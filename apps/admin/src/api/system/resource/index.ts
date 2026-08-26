import type {
  CreateSystemResourcePayload,
  CreateSystemResourcePermissionPayload,
  SystemPermission,
  SystemResource,
  SystemResourceListParams,
  UpdateSystemResourcePayload,
  UpdateSystemResourceStatusPayload,
} from '@gaoge/shared-types'

import api from '@/api'

export type {
  CreateSystemResourcePayload,
  CreateSystemResourcePermissionPayload,
  SystemPermission,
  SystemResource,
  SystemResourceListParams,
  UpdateSystemResourcePayload,
  UpdateSystemResourceStatusPayload,
}

export default {
  list: (params?: SystemResourceListParams) =>
    api.get<SystemResource[]>('/system/resources', { params }),
  create: (data: CreateSystemResourcePayload) =>
    api.post<SystemResource>('/system/resources', data),
  update: (id: number, data: UpdateSystemResourcePayload) =>
    api.patch<SystemResource>(`/system/resources/${id}`, data),
  updateStatus: (id: number, data: UpdateSystemResourceStatusPayload) =>
    api.patch<SystemResource>(`/system/resources/${id}/status`, data),
  createPermission: (id: number, data: CreateSystemResourcePermissionPayload) =>
    api.post<SystemPermission>(`/system/resources/${id}/permissions`, data),
  remove: (id: number) => api.delete<{ id: number }>(`/system/resources/${id}`),
}
