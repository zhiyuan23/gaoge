import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import {
  formatBindOptionLabel,
  resolveProfileViewState,
  shouldDisableBindConfirm,
} from '../src/pages/profile/profile-binding.ts'

test('returns loading before me payload arrives', () => {
  assert.equal(resolveProfileViewState(null), 'loading')
})

test('returns bound only when user and player are both present', () => {
  assert.equal(
    resolveProfileViewState({
      user: { isBound: true },
      player: { playerNumber: 7 },
    }),
    'bound',
  )
})

test('returns unbound when current user is not linked', () => {
  assert.equal(
    resolveProfileViewState({
      user: { isBound: false },
      player: null,
    }),
    'unbound',
  )
})

test('formats bind option labels with optional sub team', () => {
  assert.equal(
    formatBindOptionLabel({
      playerId: 12,
      playerNumber: 7,
      nickname: '齐达内',
      subTeam: 'real',
    }),
    '#7 齐达内 · real',
  )

  assert.equal(
    formatBindOptionLabel({
      playerId: 13,
      playerNumber: 9,
      nickname: '贝巴',
      subTeam: null,
    }),
    '#9 贝巴',
  )
})

test('disables confirm when selection is empty or submit is in flight', () => {
  assert.equal(shouldDisableBindConfirm(null, false), true)
  assert.equal(shouldDisableBindConfirm(7, false), false)
  assert.equal(shouldDisableBindConfirm(7, true), true)
})

test('profile page binds t-popup with visible semantics', () => {
  const source = readFileSync(new URL('../src/pages/profile/index.vue', import.meta.url), 'utf8')

  assert.match(source, /v-model:visible="bindPopupVisible"|:visible="bindPopupVisible"/)
  assert.doesNotMatch(source, /:show="bindPopupVisible"/)
})

test('profile page uses native avatar and nickname editing without openid or bound status copy in header', () => {
  const source = readFileSync(new URL('../src/pages/profile/index.vue', import.meta.url), 'utf8')

  assert.match(source, /currentPlayer\.value\?\.avatarUrl|profileAvatarUrl/)
  assert.match(source, /currentPlayer\.value\?\.nickname|profileDisplayName/)
  assert.match(source, /playerForm\.realName/)
  assert.match(source, /playerForm\.subTeam/)
  assert.match(source, /playerForm\.jerseyName/)
  assert.match(source, /playerForm\.position/)
  assert.match(source, /playerForm\.jerseySize/)
  assert.match(source, /playerForm\.remark/)
  assert.match(source, /submitPlayerProfile/)
  assert.doesNotMatch(source, /openid：/)
})
