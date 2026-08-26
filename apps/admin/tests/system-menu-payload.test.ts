import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildSystemMenuConfigurationCreatePayload,
  buildSystemMenuConfigurationUpdatePayload,
  buildSystemMenuUpdatePayload,
} from '../src/views/system/menu/model/mapper.ts'

test('menu update payload keeps an explicit empty icon clear', () => {
  const payload = buildSystemMenuUpdatePayload({
    icon: '   ',
    menuType: 'menu',
    name: 'player',
    parentId: 2,
    path: '/sports/football/player',
    routeName: 'sportsFootballPlayer',
    sort: 0,
    status: 'active',
    title: '球员信息',
    visible: true,
  })

  assert.equal(payload.icon, '')
  assert.notEqual(payload.icon, undefined)
})

test('active workspace maps a cleared existing icon to an explicit API clear', () => {
  const form = {
    icon: '   ',
    menuType: 'menu' as const,
    name: 'player',
    parentId: 2,
    path: '/sports/football/player',
    resourceIds: [5],
    routeName: 'sportsFootballPlayer',
    sort: 0,
    status: 'active' as const,
    title: '球员信息',
    visible: true,
  }

  const updatePayload = buildSystemMenuConfigurationUpdatePayload(form, '2026-08-26T12:00:00.000Z')

  assert.equal(updatePayload.icon, '')
  assert.notEqual(updatePayload.icon, undefined)
  assert.deepEqual(updatePayload.resourceIds, [5])
  assert.equal(updatePayload.expectedUpdatedAt, '2026-08-26T12:00:00.000Z')

  assert.equal(buildSystemMenuConfigurationCreatePayload(form).icon, undefined)
})
