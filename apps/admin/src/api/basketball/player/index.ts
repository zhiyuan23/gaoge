import type {
  Player,
  PlayerListParams,
  PlayerListResponse,
  PlayerPayload,
} from '@gaoge/shared-types'

import api from '@/api'

export type { Player, PlayerListParams, PlayerListResponse, PlayerPayload }

export default {
  list: (params?: PlayerListParams) =>
    api.get<PlayerListResponse>('/basketball/players', { params, noAuth: true }), // 列表接口公开，不需要权限
  create: (data: PlayerPayload) => api.post<Player>('/basketball/players', data), // 增删改需要权限
  update: (id: number, data: PlayerPayload) => api.patch<Player>(`/basketball/players/${id}`, data),
  remove: (id: number) => api.delete<Player>(`/basketball/players/${id}`),
}
