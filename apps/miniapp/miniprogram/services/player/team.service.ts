import type { MiniPageData, MiniTeamDto } from '@gaoge/miniapp-api-contract'

import { MiniRoutes } from '../../contracts/mini-api'
import { requestMiniApi } from '../../core/http'

export function fetchTeams() {
  return requestMiniApi<MiniPageData<MiniTeamDto>>({
    auth: 'optional',
    path: MiniRoutes.eventSeriesCurrentTeams,
  })
}
