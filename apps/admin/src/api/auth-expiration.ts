export type UnauthorizedHandling = 'business-error' | 'handled' | 'ignored'

interface HandleUnauthorizedOptions {
  noAuth?: boolean
  isAuthenticated: () => boolean
  expireSession: () => void
  notifyExpiration: () => void
}

export function handleUnauthorized({
  noAuth,
  isAuthenticated,
  expireSession,
  notifyExpiration,
}: HandleUnauthorizedOptions): UnauthorizedHandling {
  if (noAuth) {
    return 'business-error'
  }

  if (!isAuthenticated()) {
    return 'ignored'
  }

  expireSession()
  notifyExpiration()
  return 'handled'
}
