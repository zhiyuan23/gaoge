type EventPayload = Record<string, unknown>

type EventHandler<T extends EventPayload> = (payload: T) => void

const listeners = new Map<string, Set<EventHandler<EventPayload>>>()

export function onEvent<T extends EventPayload>(eventName: string, handler: EventHandler<T>) {
  const handlers = listeners.get(eventName) ?? new Set()
  handlers.add(handler as EventHandler<EventPayload>)
  listeners.set(eventName, handlers)

  return () => offEvent(eventName, handler)
}

export function offEvent<T extends EventPayload>(eventName: string, handler: EventHandler<T>) {
  listeners.get(eventName)?.delete(handler as EventHandler<EventPayload>)
}

export function emitEvent<T extends EventPayload>(eventName: string, payload: T) {
  listeners.get(eventName)?.forEach((handler) => handler(payload))
}
