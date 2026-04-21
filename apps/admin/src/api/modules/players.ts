import api from '../index'

export interface Player {
  id: number
  openid: string
  nickname: string
  realName: string | null
  avatarUrl: string | null
  subTeam: string | null
  birthDate: string | null
  isAdmin: boolean
  position: string | null
  jerseySize: string | null
  status: string
  remark: string | null
  createdAt: string
  updatedAt: string
}

export interface PlayerPayload {
  openid: string
  nickname: string
  realName?: string
  avatarUrl?: string
  subTeam?: string
  birthDate?: string
  isAdmin?: boolean
  position?: string
  jerseySize?: string
  status?: string
  remark?: string
}

export default {
  list: () => api.get<Player[]>('/players', { noAuth: true }), // 列表接口公开，不需要权限
  create: (data: PlayerPayload) => api.post<Player>('/players', data), // 增删改需要权限
  update: (id: number, data: PlayerPayload) => api.patch<Player>(`/players/${id}`, data),
  remove: (id: number) => api.delete<Player>(`/players/${id}`),
}
