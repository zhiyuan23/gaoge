import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import { fixedHiddenRoutes } from '../src/router/fixed-hidden-routes.ts'
import {
  getSystemResourceIcon,
  getSystemResourceModuleIcon,
} from '../src/views/system/components/system-resource-groups.ts'
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

test('resource tree icons match menu semantics and retain safe fallbacks', () => {
  assert.equal(getSystemResourceModuleIcon('football'), 'i-proicons:soccer')
  assert.equal(getSystemResourceModuleIcon('content'), 'i-ri:article-line')
  assert.equal(getSystemResourceModuleIcon('system'), 'i-ri:settings-3-line')
  assert.equal(getSystemResourceModuleIcon('custom'), 'i-ri:folder-3-line')

  assert.equal(getSystemResourceIcon('football.player'), 'i-ri:user-star-line')
  assert.equal(getSystemResourceIcon('system.menu'), 'i-ri:menu-line')
  assert.equal(getSystemResourceIcon('system.permission'), 'i-ri:key-2-line')
  assert.equal(getSystemResourceIcon('system.wechat-share'), 'i-ri:share-line')
  assert.equal(getSystemResourceIcon('custom.unknown'), 'i-ri:stack-line')
})
