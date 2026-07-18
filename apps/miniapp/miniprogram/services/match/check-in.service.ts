import type { MiniCheckInDto, MiniCheckInScanRequestDto } from '@gaoge/miniapp-api-contract'

import { MiniRoutes } from '../../contracts/mini-api'
import { requestMiniApi } from '../../core/http'

export function scanCheckIn(data: MiniCheckInScanRequestDto) {
  return requestMiniApi<MiniCheckInDto, MiniCheckInScanRequestDto>({
    auth: 'required',
    data,
    method: 'POST',
    path: MiniRoutes.checkInScan,
  })
}
