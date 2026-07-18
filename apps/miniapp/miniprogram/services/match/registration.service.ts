import type {
  MiniCreateRegistrationRequestDto,
  MiniRegistrationDto,
} from '@gaoge/miniapp-api-contract'

import { MiniRoutes } from '../../contracts/mini-api'
import { requestMiniApi } from '../../core/http'

export function createRegistration(data: MiniCreateRegistrationRequestDto) {
  return requestMiniApi<MiniRegistrationDto, MiniCreateRegistrationRequestDto>({
    auth: 'required',
    data,
    method: 'POST',
    path: MiniRoutes.registrations,
  })
}
