import { AsyncLocalStorage } from 'node:async_hooks'

type RequestContext = { requestId: string }

const requestContextStorage = new AsyncLocalStorage<RequestContext>()

export function runWithRequestContext<T>(context: RequestContext, operation: () => T) {
  return requestContextStorage.run(context, operation)
}

export function getCurrentRequestId() {
  return requestContextStorage.getStore()?.requestId
}
