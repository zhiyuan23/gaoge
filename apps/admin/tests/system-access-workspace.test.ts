import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import { fixedHiddenRoutes } from '../src/router/fixed-hidden-routes.ts'
import {
  resolveSystemAccessWorkspaceMode,
  useSystemAccessWorkspaceMode,
} from '../src/views/system/menu/workspace-mode.ts'

const workspaceSource = readFileSync(
  new URL('../src/views/system/menu/workspace.vue', import.meta.url),
  'utf8',
)

test('menu and resource modes stay inside the same page', () => {
  const state = useSystemAccessWorkspaceMode()
  assert.equal(state.mode.value, 'menus')

  state.search.value = '流言板'
  state.mobileDetailOpen.value = true
  state.switchMode('resources')

  assert.equal(state.mode.value, 'resources')
  assert.equal(state.search.value, '')
  assert.equal(state.mobileDetailOpen.value, false)
})

test('the legacy permission route redirects to the resources workspace view', () => {
  const permissionRoute = fixedHiddenRoutes.find(({ name }) => name === 'systemPermission')
  assert.deepEqual(permissionRoute?.redirect, {
    name: 'systemMenu',
    query: { view: 'resources' },
  })
})

test('route view values select resources while ordinary system menu routes select menus', () => {
  assert.equal(resolveSystemAccessWorkspaceMode('resources'), 'resources')
  assert.equal(resolveSystemAccessWorkspaceMode(undefined), 'menus')

  const resourceState = useSystemAccessWorkspaceMode()
  resourceState.switchMode('resources')
  assert.equal(resourceState.mode.value, 'resources')

  const menuState = useSystemAccessWorkspaceMode()
  menuState.switchMode(undefined)
  assert.equal(menuState.mode.value, 'menus')
})

test('the workspace applies route query changes immediately without writing URLs', () => {
  assert.match(workspaceSource, /useSystemAccessWorkspaceMode/)
  assert.match(workspaceSource, /route\.query\.view/)
  assert.match(workspaceSource, /immediate:\s*true/)
  assert.doesNotMatch(workspaceSource, /router\.replace|router\.push/)
})
