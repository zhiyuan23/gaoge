import type { MiniPageData, MiniScheduleDto } from '@gaoge/miniapp-api-contract'

import { MiniRoutes } from '../../contracts/mini-api'
import { requestMiniApi } from '../../core/http'

export function fetchSchedules() {
  return requestMiniApi<MiniPageData<MiniScheduleDto>>({
    auth: 'optional',
    path: MiniRoutes.eventSeriesCurrentSchedules,
  })
}
