import assert from 'node:assert/strict'
import test from 'node:test'

import {
  resolveHeadSidebarPanels,
  resolveSubSidebarPanels,
} from '../src/store/menu/resolve-sidebar-menus.ts'

const menus: Menu.recordMainRaw[] = [
  {
    meta: { title: '业务管理' },
    children: [{ path: '/players', meta: { title: '球员列表' } }],
  },
  {
    meta: { title: '系统管理' },
    children: [{ path: '/users', meta: { title: '用户管理' } }],
  },
]

test('head keeps every sidebar panel mounted and only changes visibility', () => {
  assert.deepEqual(resolveHeadSidebarPanels(menus, 1), [
    {
      key: 0,
      menu: [{ path: '/players', meta: { title: '球员列表' } }],
      visible: false,
    },
    {
      key: 1,
      menu: [{ path: '/users', meta: { title: '用户管理' } }],
      visible: true,
    },
  ])
})

test('head keeps its only sidebar panel visible when the active index is stale', () => {
  assert.deepEqual(resolveHeadSidebarPanels(menus.slice(0, 1), 9), [
    {
      key: 0,
      menu: [{ path: '/players', meta: { title: '球员列表' } }],
      visible: true,
    },
  ])
})

test('single and head keep stable outer panels while switching visibility', () => {
  const headPanels = resolveSubSidebarPanels(menus, menus[1].children, 'head', 1)
  const singlePanels = resolveSubSidebarPanels(menus, menus, 'single', 0)

  assert.deepEqual(
    headPanels.map(({ key, render, visible }) => ({ key, render, visible })),
    [
      { key: 'head-0', render: true, visible: false },
      { key: 'head-1', render: true, visible: true },
      { key: 'projected', render: false, visible: false },
    ],
  )
  assert.deepEqual(
    singlePanels.map(({ key, render, visible }) => ({ key, render, visible })),
    [
      { key: 'head-0', render: false, visible: false },
      { key: 'head-1', render: false, visible: false },
      { key: 'projected', render: true, visible: true },
    ],
  )
})
