import type { Team, TeamListParams, TeamListResponse, TeamPayload } from '@gaoge/shared-types'

import api from '@/api'

export type { Team, TeamListParams, TeamListResponse, TeamPayload }

export default {
  list: (params?: TeamListParams) =>
    api.get<TeamListResponse>('/basketball/teams', { params, noAuth: true }), // 列表接口公开，不需要权限
  create: (data: TeamPayload) => api.post<Team>('/basketball/teams', data), // 增删改需要权限
  update: (id: number, data: TeamPayload) => api.patch<Team>(`/basketball/teams/${id}`, data),
  remove: (id: number) => api.delete<Team>(`/basketball/teams/${id}`),
}
