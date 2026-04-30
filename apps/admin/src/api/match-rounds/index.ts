import type {
  MatchRound,
  MatchRoundListParams,
  MatchRoundListResponse,
  MatchRoundPayload,
  UpdateMatchRoundPayload,
} from '@gaoge/shared-types'

import api from '../index'

export type {
  MatchRound,
  MatchRoundListParams,
  MatchRoundListResponse,
  MatchRoundPayload,
  UpdateMatchRoundPayload,
}

export default {
  list: (params?: MatchRoundListParams) =>
    api.get<MatchRoundListResponse>('/match-rounds', { params, noAuth: true }),
  detail: (id: number) => api.get<MatchRound>(`/match-rounds/${id}`, { noAuth: true }),
  create: (data: MatchRoundPayload) => api.post<MatchRound>('/match-rounds', data),
  update: (id: number, data: UpdateMatchRoundPayload) =>
    api.patch<MatchRound>(`/match-rounds/${id}`, data),
  remove: (id: number) => api.delete<MatchRound>(`/match-rounds/${id}`),
}
