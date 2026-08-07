import assert from 'node:assert/strict'
import test from 'node:test'

import { resolveSidebarMenus } from '../src/store/menu/resolve-sidebar-menus.ts'

const twoLevelMenus: Menu.recordMainRaw[] = [
  {
    meta: { title: '业务管理', icon: 'business' },
    children: [{ path: '/players', meta: { title: '球员列表' } }],
  },
  {
    meta: { title: '系统管理' },
    children: [{ path: '/users', meta: { title: '用户管理' } }],
  },
]

const threeLevelMenus: Menu.recordMainRaw[] = [
  {
    meta: { title: '业务管理' },
    children: [
      { path: '/overview', meta: { title: '业务概览' } },
      {
        meta: { title: '球员管理' },
        children: [{ path: '/players', meta: { title: '球员列表' } }],
      },
    ],
  },
]

const fourLevelMenus: Menu.recordMainRaw[] = [
  {
    meta: { title: '平台' },
    children: [
      { path: '/overview', meta: { title: '平台概览' } },
      {
        meta: { title: '业务管理' },
        children: [
          { path: '/summary', meta: { title: '业务汇总' } },
          {
            meta: { title: '球员管理' },
            children: [{ path: '/players', meta: { title: '球员列表' } }],
          },
        ],
      },
    ],
  },
]

test('single keeps level one when the project menu has only two levels', () => {
  assert.deepEqual(resolveSidebarMenus(twoLevelMenus, 'single', 0), [
    {
      meta: { title: '业务管理', icon: 'business' },
      children: [{ path: '/players', meta: { title: '球员列表' } }],
    },
    {
      meta: { title: '系统管理' },
      children: [{ path: '/users', meta: { title: '用户管理' } }],
    },
  ])
})

test('single can hide level one through project settings', () => {
  assert.deepEqual(resolveSidebarMenus(twoLevelMenus, 'single', 0, true), [
    { path: '/players', meta: { title: '球员列表' } },
    { path: '/users', meta: { title: '用户管理' } },
  ])
})

test('single preserves the complete tree when first-level hiding is disabled', () => {
  assert.deepEqual(resolveSidebarMenus(threeLevelMenus, 'single', 0, false), [
    {
      meta: { title: '业务管理' },
      children: [
        { path: '/overview', meta: { title: '业务概览' } },
        {
          meta: { title: '球员管理' },
          children: [{ path: '/players', meta: { title: '球员列表' } }],
        },
      ],
    },
  ])
})

test('single removes exactly one level when first-level hiding is enabled', () => {
  assert.deepEqual(resolveSidebarMenus(fourLevelMenus, 'single', 0, true), [
    { path: '/overview', meta: { title: '平台概览' } },
    {
      meta: { title: '业务管理' },
      children: [
        { path: '/summary', meta: { title: '业务汇总' } },
        {
          meta: { title: '球员管理' },
          children: [{ path: '/players', meta: { title: '球员列表' } }],
        },
      ],
    },
  ])
})

test('side keeps rendering only the active group children', () => {
  assert.deepEqual(resolveSidebarMenus(twoLevelMenus, 'side', 1), [
    { path: '/users', meta: { title: '用户管理' } },
  ])
})

test('head keeps rendering only the active group children', () => {
  assert.deepEqual(resolveSidebarMenus(twoLevelMenus, 'head', 0), [
    { path: '/players', meta: { title: '球员列表' } },
  ])
})

test('returns no sidebar items when the active group is unavailable', () => {
  assert.deepEqual(resolveSidebarMenus(twoLevelMenus, 'side', 9), [])
})
