import assert from 'node:assert/strict'
import test from 'node:test'

import type { Player } from '@gaoge/shared-types'

import { createEmptyPlayerForm } from '../src/views/sports/football/player/model/defaults.ts'
import {
  buildPlayerPayload,
  createPlayerFormFromRow,
} from '../src/views/sports/football/player/model/mapper.ts'

test('maps a nullable superhero name into an empty Admin form value', () => {
  const form = createPlayerFormFromRow({
    superheroName: null,
  } as Player)

  assert.equal(form.superheroName, '')
})

test('trims a superhero name and maps blank input to an explicit null clear', () => {
  const form = createEmptyPlayerForm()
  form.playerNumber = 7
  form.nickname = '高歌7号'
  form.superheroName = '  蝙蝠侠  '

  assert.equal(buildPlayerPayload(form).superheroName, '蝙蝠侠')

  form.superheroName = '   '

  assert.equal(buildPlayerPayload(form).superheroName, null)
})
