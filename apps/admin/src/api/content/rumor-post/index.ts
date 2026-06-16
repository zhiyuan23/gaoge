import type {
  RumorPost,
  RumorPostListParams,
  RumorPostListResponse,
  RumorPostPayload,
} from '@gaoge/shared-types'

import api from '@/api'

export type { RumorPost, RumorPostListParams, RumorPostListResponse, RumorPostPayload }

export default {
  list: (params?: RumorPostListParams) =>
    api.get<RumorPostListResponse>('/content/rumor-posts', { params }),
  create: (data: RumorPostPayload) => api.post<RumorPost>('/content/rumor-posts', data),
  update: (id: number, data: RumorPostPayload) =>
    api.patch<RumorPost>(`/content/rumor-posts/${id}`, data),
  remove: (id: number) => api.delete<RumorPost>(`/content/rumor-posts/${id}`),
  publish: (id: number) => api.post<RumorPost>(`/content/rumor-posts/${id}/publish`),
}
