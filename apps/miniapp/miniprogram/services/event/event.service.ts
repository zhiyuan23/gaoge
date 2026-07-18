import type { MiniHomeDto } from '@gaoge/miniapp-api-contract'

import { MiniRoutes } from '../../contracts/mini-api'
import { requestMiniApi } from '../../core/http'

export function fetchCurrentHome() {
  return requestMiniApi<MiniHomeDto>({
    auth: 'optional',
    path: MiniRoutes.eventSeriesCurrentHome,
  })
}
