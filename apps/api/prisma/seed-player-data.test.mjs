import assert from 'node:assert/strict'
import test from 'node:test'

import { shouldResetPlayers } from './seed-player-data.ts'

test('skips destructive player reset when no seed players are configured', () => {
  assert.equal(shouldResetPlayers([]), false)
})

test('allows player reset only when seed players exist', () => {
  assert.equal(shouldResetPlayers([{ playerNumber: 7, nickname: '齐达内' }]), true)
})
