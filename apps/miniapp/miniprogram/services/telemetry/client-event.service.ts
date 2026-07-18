import { MiniRoutes } from '../../contracts/mini-api'
import { requestMiniApi } from '../../core/http'

export interface ClientEventPayload {
  name: string
  value?: number
  properties?: Record<string, string | number | boolean>
  occurredAt: string
}

export function reportClientEvents(events: ClientEventPayload[]) {
  return requestMiniApi<{ accepted: number }, { events: ClientEventPayload[] }>({
    auth: 'optional',
    data: { events },
    method: 'POST',
    path: MiniRoutes.clientEvents,
  })
}
