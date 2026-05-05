import type { PlayerListParams, PlayerListResponse } from '@gaoge/shared-types'

import api from '@/api/request'

export default {
  list: (params?: PlayerListParams) => api.get<PlayerListResponse>('/football/players', params),
}
