import type {
  CreateSystemMenuPayload,
  SystemMenu,
  UpdateSystemMenuPayload,
  UpdateSystemMenuPermissionsPayload,
  UpdateSystemMenuResourcesPayload,
  UpdateSystemMenuSortPayload,
} from '@gaoge/shared-types'

import api from '@/api'

export type {
  CreateSystemMenuPayload,
  SystemMenu,
  UpdateSystemMenuPayload,
  UpdateSystemMenuPermissionsPayload,
  UpdateSystemMenuResourcesPayload,
  UpdateSystemMenuSortPayload,
}

export default {
  tree: () => api.get<SystemMenu[]>('/system/menus/tree'),
  create: (data: CreateSystemMenuPayload) => api.post<SystemMenu>('/system/menus', data),
  update: (id: number, data: UpdateSystemMenuPayload) =>
    api.patch<SystemMenu>(`/system/menus/${id}`, data),
  updateSort: (id: number, data: UpdateSystemMenuSortPayload) =>
    api.patch<SystemMenu>(`/system/menus/${id}/sort`, data),
  updatePermissions: (id: number, data: UpdateSystemMenuPermissionsPayload) =>
    api.patch<SystemMenu>(`/system/menus/${id}/permissions`, data),
  updateResources: (id: number, data: UpdateSystemMenuResourcesPayload) =>
    api.patch<SystemMenu>(`/system/menus/${id}/resources`, data),
  remove: (id: number) => api.delete<{ id: number }>(`/system/menus/${id}`),
}
