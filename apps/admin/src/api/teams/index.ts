import type { Team, TeamListParams, TeamListResponse, TeamPayload } from '@gaoge/shared-types'

import api from '../index'

export type { Team, TeamListParams, TeamListResponse, TeamPayload }

export default {
  list: (params?: TeamListParams) => api.get<TeamListResponse>('/teams', { params, noAuth: true }), // 列表接口公开，不需要权限
  create: (data: TeamPayload) => api.post<Team>('/teams', data), // 增删改需要权限
  update: (id: number, data: TeamPayload) => api.patch<Team>(`/teams/${id}`, data),
  remove: (id: number) => api.delete<Team>(`/teams/${id}`),
}
