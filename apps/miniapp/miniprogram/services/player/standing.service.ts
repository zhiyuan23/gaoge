import type { MiniStandingRowDto } from '@gaoge/miniapp-api-contract'

import { MiniRoutes } from '../../contracts/mini-api'
import { requestMiniApi } from '../../core/http'

export function fetchStandings() {
  return requestMiniApi<MiniStandingRowDto[]>({
    auth: 'optional',
    path: MiniRoutes.eventSeriesCurrentStandings,
  })
}
