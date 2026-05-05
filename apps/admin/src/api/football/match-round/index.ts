import type {
  MatchRound,
  MatchRoundListParams,
  MatchRoundListResponse,
  MatchRoundPayload,
  UpdateMatchRoundPayload,
} from '@gaoge/shared-types'

import api from '@/api'

export type {
  MatchRound,
  MatchRoundListParams,
  MatchRoundListResponse,
  MatchRoundPayload,
  UpdateMatchRoundPayload,
}

export default {
  list: (params?: MatchRoundListParams) =>
    api.get<MatchRoundListResponse>('/football/match-rounds', { params, noAuth: true }),
  detail: (id: number) => api.get<MatchRound>(`/football/match-rounds/${id}`, { noAuth: true }),
  create: (data: MatchRoundPayload) => api.post<MatchRound>('/football/match-rounds', data),
  update: (id: number, data: UpdateMatchRoundPayload) =>
    api.patch<MatchRound>(`/football/match-rounds/${id}`, data),
  remove: (id: number) => api.delete<MatchRound>(`/football/match-rounds/${id}`),
}
