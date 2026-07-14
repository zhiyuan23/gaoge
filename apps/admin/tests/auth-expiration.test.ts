import assert from 'node:assert/strict'
import test from 'node:test'

import { handleUnauthorized } from '../src/api/auth-expiration.ts'

function createContext(options: { noAuth?: boolean; authenticated?: boolean } = {}) {
  let authenticated = options.authenticated ?? true
  let logoutCount = 0
  let notificationCount = 0

  return {
    handle: () =>
      handleUnauthorized({
        noAuth: options.noAuth,
        isAuthenticated: () => authenticated,
        expireSession: () => {
          authenticated = false
          logoutCount += 1
        },
        notifyExpiration: () => {
          notificationCount += 1
        },
      }),
    counts: () => ({ logoutCount, notificationCount }),
  }
}

test('handles the first unauthorized response and ignores concurrent responses', () => {
  const context = createContext()

  assert.equal(context.handle(), 'handled')
  assert.equal(context.handle(), 'ignored')
  assert.deepEqual(context.counts(), { logoutCount: 1, notificationCount: 1 })
})

test('keeps public unauthorized responses in the business error flow', () => {
  const context = createContext({ noAuth: true })

  assert.equal(context.handle(), 'business-error')
  assert.deepEqual(context.counts(), { logoutCount: 0, notificationCount: 0 })
})

test('ignores unauthorized responses after the session is already cleared', () => {
  const context = createContext({ authenticated: false })

  assert.equal(context.handle(), 'ignored')
  assert.deepEqual(context.counts(), { logoutCount: 0, notificationCount: 0 })
})
