import type { MiniEventSeriesDto } from '@gaoge/miniapp-api-contract'

export interface EventState {
  current?: MiniEventSeriesDto
}

const eventState: EventState = {}

export function getEventState() {
  return eventState
}

export function setEventState(nextState: Partial<EventState>) {
  if ('current' in nextState) {
    eventState.current = nextState.current
  }
}
