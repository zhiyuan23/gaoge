import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import type { RouteRecordRaw } from 'vue-router'

import type { AdminNavigationNode } from '@gaoge/shared-types'

import { fixedHiddenRoutes } from '../src/router/fixed-hidden-routes.ts'
import { resolveServerNavigation } from '../src/router/server-navigation.ts'
import {
  finalizeServerNavigationFailure,
  initializeServerNavigation,
} from '../src/router/server-navigation-guard.ts'
import { shouldFilterMenusByPermission } from '../src/store/menu/navigation-mode.ts'

import type { Menu, Route } from '#/global'

const serverTree: AdminNavigationNode[] = [
  {
    routeName: 'sports',
    type: 'group',
    path: null,
    title: '高歌体育',
    icon: 'solar:cup-star-outline',
    children: [
      {
        routeName: 'sportsFootball',
        type: 'catalog',
        path: '/sports/football',
        title: '高歌 FC',
        icon: 'proicons:soccer',
        children: [
          {
            routeName: 'player',
            type: 'menu',
            path: '/sports/football/player',
            title: '球员信息',
            icon: null,
            children: [],
          },
        ],
      },
    ],
  },
  {
    routeName: 'systemManagement',
    type: 'group',
    path: null,
    title: '系统管理',
    icon: 'ri:settings-3-line',
    children: [
      {
        routeName: 'system',
        type: 'catalog',
        path: '/system',
        title: '用户权限',
        icon: 'ri:settings-3-line',
        children: [
          {
            routeName: 'systemUser',
            type: 'menu',
            path: '/system/user',
            title: '用户管理',
            icon: null,
            children: [],
          },
        ],
      },
    ],
  },
]

const unknownLeafTree: AdminNavigationNode = {
  routeName: 'unknownGroup',
  type: 'group',
  path: null,
  title: '未知分组',
  icon: null,
  children: [
    {
      routeName: 'unknownPage',
      type: 'menu',
      path: '/unknown',
      title: '未知页面',
      icon: null,
      children: [],
    },
  ],
}

function createSinglePageTree(nodeType: 'catalog' | 'menu', path: string): AdminNavigationNode[] {
  return [
    {
      routeName: 'sports',
      type: 'group',
      path: null,
      title: '高歌体育',
      icon: null,
      children: [
        {
          routeName: 'sportsFootball',
          type: 'catalog',
          path: nodeType === 'catalog' ? path : '/sports/football',
          title: '高歌 FC',
          icon: null,
          children: [
            {
              routeName: 'player',
              type: 'menu',
              path: nodeType === 'menu' ? path : '/sports/football/player',
              title: '球员信息',
              icon: null,
              children: [],
            },
          ],
        },
      ],
    },
  ]
}

function createTreeWithPageRouteName(routeName: string): AdminNavigationNode[] {
  const tree = createSinglePageTree('menu', '/sports/football/player')
  tree[0].children[0].children[0].routeName = routeName
  return tree
}

function findRoute(routes: Route.recordMainRaw[], name: string): RouteRecordRaw | undefined {
  const queue = routes.flatMap((item) => item.children)
  while (queue.length > 0) {
    const route = queue.shift()!
    if (route.name === name) return route
    queue.push(...(route.children ?? []))
  }
  return undefined
}

test('preserves server group and sibling order', () => {
  const result = resolveServerNavigation(serverTree)

  assert.deepEqual(
    result.menus.map((item) => item.meta?.title),
    ['高歌体育', '系统管理'],
  )
})

test('maps a registered page route to its component', () => {
  const result = resolveServerNavigation(serverTree)

  assert.equal(findRoute(result.routes, 'player')?.path, '/sports/football/player')
  assert.equal(typeof findRoute(result.routes, 'player')?.component, 'function')
})

test('fails closed for an unknown page route', () => {
  const result = resolveServerNavigation([unknownLeafTree])

  assert.equal(findRoute(result.routes, 'unknownPage'), undefined)
  assert.deepEqual(result.menus, [])
  assert.match(result.diagnostics[0], /unknownPage/)
})

test('fails closed for inherited registry page route names', () => {
  for (const routeName of ['constructor', 'toString', '__proto__']) {
    const result = resolveServerNavigation(createTreeWithPageRouteName(routeName))

    assert.equal(findRoute(result.routes, routeName), undefined)
    assert.deepEqual(result.menus, [])
    assert.match(result.diagnostics[0], new RegExp(routeName))
  }
})

test('rejects non-normalized absolute catalog and page paths', () => {
  const invalidPaths = [
    '//navigation.example/player',
    '/sports/football/player?tab=details',
    '/sports/football/player#details',
    '/sports/./football/player',
    '/sports/football/../player',
    '/sports\\football\\player',
    '/sports/%2e%2e/player',
    '/sports/%2Ffootball/player',
    '/sports//football/player',
    '/sports/football/player/',
  ]

  for (const nodeType of ['catalog', 'menu'] as const) {
    for (const path of invalidPaths) {
      const result = resolveServerNavigation(createSinglePageTree(nodeType, path))

      assert.deepEqual(result.menus, [])
      assert.deepEqual(result.routes, [])
      assert.match(result.diagnostics[0], /absolute path/)
    }
  }
})

test('accepts normalized absolute catalog and page paths', () => {
  const validPaths = ['/sports/football', '/system/user']

  for (const nodeType of ['catalog', 'menu'] as const) {
    for (const path of validPaths) {
      const result = resolveServerNavigation(createSinglePageTree(nodeType, path))

      assert.equal(result.diagnostics.length, 0)
      assert.equal(result.menus.length, 1)
      assert.equal(
        findRoute(result.routes, nodeType === 'catalog' ? 'sportsFootball' : 'player')?.path,
        path,
      )
    }
  }
})

test('uses server titles for one resolved route and menu tree', () => {
  const serverTreeWithRenamedTitle = structuredClone(serverTree)
  serverTreeWithRenamedTitle[0].title = '体育运营'
  serverTreeWithRenamedTitle[0].children[0].children[0].title = '球员档案'

  const result = resolveServerNavigation(serverTreeWithRenamedTitle)

  assert.equal(result.menus[0].meta?.title, '体育运营')
  assert.equal(findRoute(result.routes, 'player')?.meta?.title, '球员档案')
})

test('initializes backend navigation once and shares the resolved result with both stores', async () => {
  const navigation = structuredClone(serverTree)
  const resolved = resolveServerNavigation(navigation)
  let fetchCalls = 0
  let resolveCalls = 0
  let appliedRoutes: Route.recordMainRaw[] | undefined
  let appliedMenus: Menu.recordMainRaw[] | undefined
  let reportedDiagnostics: string[] | undefined

  await initializeServerNavigation({
    fetchNavigation: async () => {
      fetchCalls++
      return navigation
    },
    resolveNavigation: (input) => {
      resolveCalls++
      assert.strictEqual(input, navigation)
      return resolved
    },
    setRoutes: (routes) => {
      appliedRoutes = routes
    },
    setMenus: (menus) => {
      appliedMenus = menus
    },
    reportDiagnostics: (diagnostics) => {
      reportedDiagnostics = diagnostics
    },
  })

  assert.equal(fetchCalls, 1)
  assert.equal(resolveCalls, 1)
  assert.strictEqual(appliedRoutes, resolved.routes)
  assert.strictEqual(appliedMenus, resolved.menus)
  assert.strictEqual(reportedDiagnostics, resolved.diagnostics)
})

test('fails closed when backend navigation fetch or resolution fails', async () => {
  for (const failure of ['fetch', 'resolve'] as const) {
    const calls: Array<{ kind: 'routes' | 'menus'; value: unknown[] }> = []

    await assert.rejects(
      initializeServerNavigation({
        fetchNavigation: async () => {
          if (failure === 'fetch') throw new Error('fetch failed')
          return structuredClone(serverTree)
        },
        resolveNavigation: () => {
          if (failure === 'resolve') throw new Error('resolve failed')
          return resolveServerNavigation(serverTree)
        },
        setRoutes: (routes) => calls.push({ kind: 'routes', value: routes }),
        setMenus: (menus) => calls.push({ kind: 'menus', value: menus }),
        reportDiagnostics: () => {
          throw new Error('diagnostics must not be reported after a failure')
        },
      }),
    )

    assert.deepEqual(calls, [
      { kind: 'routes', value: [] },
      { kind: 'menus', value: [] },
    ])
  }
})

test('finalizes a pre-navigation backend failure with empty generated state', () => {
  const calls: Array<{ kind: 'routes' | 'menus'; value: unknown[] }> = []

  const finalized = finalizeServerNavigationFailure({
    isGenerated: false,
    setRoutes: (routes) => calls.push({ kind: 'routes', value: routes }),
    setMenus: (menus) => calls.push({ kind: 'menus', value: menus }),
  })

  assert.equal(finalized, true)
  assert.deepEqual(calls, [
    { kind: 'routes', value: [] },
    { kind: 'menus', value: [] },
  ])
})

test('keeps an existing terminal route state when failure bubbles to the outer guard', () => {
  const calls: string[] = []

  const finalized = finalizeServerNavigationFailure({
    isGenerated: true,
    setRoutes: () => calls.push('routes'),
    setMenus: () => calls.push('menus'),
  })

  assert.equal(finalized, false)
  assert.deepEqual(calls, [])
})

test('retains systemPermission as a fixed backend route', () => {
  assert.deepEqual(
    fixedHiddenRoutes.map(({ path, name }) => ({ path, name })),
    [{ path: '/system/permission', name: 'systemPermission' }],
  )
  assert.deepEqual(fixedHiddenRoutes[0].redirect, {
    name: 'systemMenu',
    query: { view: 'resources' },
  })
  assert.deepEqual(fixedHiddenRoutes[0].meta?.auth, ['system.permission.view'])
  assert.equal(fixedHiddenRoutes[0].meta?.menu, false)
  assert.equal(fixedHiddenRoutes[0].meta?.breadcrumb, false)
})

test('keeps business navigation metadata out of static route modules', () => {
  const routesSource = readFileSync(new URL('../src/router/routes.ts', import.meta.url), 'utf8')

  assert.doesNotMatch(routesSource, /modules\/sports/)
  assert.doesNotMatch(routesSource, /modules\/system/)
  assert.doesNotMatch(routesSource, /modules\/wechat/)
})

test('removes obsolete mock, route modules, and structure script', () => {
  const appMockSource = readFileSync(new URL('../src/mock/app.ts', import.meta.url), 'utf8')
  const adminRoot = path.resolve(import.meta.dirname, '..')
  const obsoletePaths = [
    'scripts/menu-route-structure.check.ts',
    'src/router/modules/sports/index.ts',
    'src/router/modules/sports/football.ts',
    'src/router/modules/sports/content.ts',
    'src/router/modules/system/index.ts',
    'src/router/modules/system/wechat-share.ts',
    'src/router/modules/wechat/index.ts',
  ]

  assert.doesNotMatch(appMockSource, /\/mock\/app\/route\/list/)
  for (const obsoletePath of obsoletePaths) {
    assert.equal(existsSync(path.join(adminRoot, obsoletePath)), false, obsoletePath)
  }
})

test('keeps business navigation title and icon metadata out of page route blocks', () => {
  const viewsRoot = path.resolve(import.meta.dirname, '../src/views')

  for (const domain of ['sports', 'system']) {
    const domainRoot = path.join(viewsRoot, domain)
    const viewFiles = readdirSync(domainRoot, { recursive: true }).filter((file) =>
      file.endsWith('.vue'),
    )

    for (const viewFile of viewFiles) {
      const source = readFileSync(path.join(domainRoot, viewFile), 'utf8')
      const routeBlocks = source.match(/<route\b[^>]*>[\s\S]*?<\/route>/g) ?? []
      for (const routeBlock of routeBlocks) {
        assert.doesNotMatch(routeBlock, /\b(?:title|icon)\s*:/, `${domain}/${viewFile}`)
      }
    }
  }
})

test('documents cross-repository mechanism sharing without copying project business metadata', () => {
  const conventionSource = readFileSync(
    new URL('../../../docs/conventions/admin-navigation.md', import.meta.url),
    'utf8',
  )

  assert.match(conventionSource, /只同步机制/)
  assert.match(conventionSource, /不得同步本项目的实际 registry key、组件映射或业务菜单树/)
})

test('uses backend defaults and skips local menu authorization filtering in backend mode', () => {
  const settingsSource = readFileSync(new URL('../src/settings.ts', import.meta.url), 'utf8')
  const menuStoreSource = readFileSync(
    new URL('../src/store/menu/index.ts', import.meta.url),
    'utf8',
  )
  const guardSource = readFileSync(new URL('../src/router/guards.ts', import.meta.url), 'utf8')

  assert.match(settingsSource, /routeBaseOn: 'backend'/)
  assert.equal(shouldFilterMenusByPermission('backend', true), false)
  assert.equal(shouldFilterMenusByPermission('frontend', true), true)
  assert.match(menuStoreSource, /shouldFilterMenusByPermission/)
  assert.match(guardSource, /initializeServerNavigation/)
})
