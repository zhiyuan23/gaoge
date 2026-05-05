import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import playerApi, { normalizePlayerListParams } from './index'

describe('player api', () => {
  it('fills default page params for the debug page', () => {
    assert.deepEqual(normalizePlayerListParams(), { page: 1, pageSize: 100 })
  })

  it('exposes a list method on the default export', () => {
    assert.equal(typeof playerApi.list, 'function')
  })
})
