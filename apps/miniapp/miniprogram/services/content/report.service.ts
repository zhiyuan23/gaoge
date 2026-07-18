import type { MiniPageData, MiniReportDto } from '@gaoge/miniapp-api-contract'

import { MiniRoutes } from '../../contracts/mini-api'
import { requestMiniApi } from '../../core/http'

export function fetchReports() {
  return requestMiniApi<MiniPageData<MiniReportDto>>({
    auth: 'optional',
    path: MiniRoutes.reports,
  })
}
