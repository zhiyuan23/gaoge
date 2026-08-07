import assert from 'node:assert/strict'
import test from 'node:test'

import { resolveSubSidebarTransitionName } from '../src/layouts/components/SubSidebar/transition.ts'

test('single mode changes use the side transition when the index stays unchanged', () => {
  assert.equal(resolveSubSidebarTransitionName('single', 0, 0, false), 'sub-sidebar-y-end')
})

test('head and side retain their directional transition families', () => {
  assert.equal(resolveSubSidebarTransitionName('head', 2, 1, false), 'sub-sidebar-x-start')
  assert.equal(resolveSubSidebarTransitionName('side', 1, 2, false), 'sub-sidebar-y-end')
})
