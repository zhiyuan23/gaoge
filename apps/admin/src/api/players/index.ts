import type { Player, PlayerPayload } from '@gaoge/shared-types'

import api from '../index'

export type { Player, PlayerPayload }

export default {
  list: () => api.get<Player[]>('/players', { noAuth: true }), // 列表接口公开，不需要权限
  create: (data: PlayerPayload) => api.post<Player>('/players', data), // 增删改需要权限
  update: (id: number, data: PlayerPayload) => api.patch<Player>(`/players/${id}`, data),
  remove: (id: number) => api.delete<Player>(`/players/${id}`),
}
