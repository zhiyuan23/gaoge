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
    api.get<MatchRoundListResponse>('/basketball/match-rounds', { params, noAuth: true }),
  detail: (id: number) => api.get<MatchRound>(`/basketball/match-rounds/${id}`, { noAuth: true }),
  create: (data: MatchRoundPayload) => api.post<MatchRound>('/basketball/match-rounds', data),
  update: (id: number, data: UpdateMatchRoundPayload) =>
    api.patch<MatchRound>(`/basketball/match-rounds/${id}`, data),
  remove: (id: number) => api.delete<MatchRound>(`/basketball/match-rounds/${id}`),
}
