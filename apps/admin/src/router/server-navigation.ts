import type { RouteRecordRaw } from 'vue-router'

import type { AdminNavigationNode } from '@gaoge/shared-types'

import type { ComponentLoader } from './admin-page-registry.ts'
import { adminPageRegistry } from './admin-page-registry.ts'

import type { Menu, Route } from '#/global'

interface ResolvedNavigationNode {
  firstPagePath?: string
  menu?: Menu.recordRaw
  routes: RouteRecordRaw[]
}

function Layout() {
  return import('@/layouts/index.vue')
}

const layoutLoader: ComponentLoader = Layout

export function resolveServerNavigation(nodes: AdminNavigationNode[]): {
  diagnostics: string[]
  menus: Menu.recordMainRaw[]
  routes: Route.recordMainRaw[]
} {
  const diagnostics: string[] = []
  const menus: Menu.recordMainRaw[] = []
  const routes: Route.recordMainRaw[] = []

  for (const node of nodes) {
    const resolved = resolveNode(node, diagnostics)
    if (!resolved.menu) continue

    menus.push({
      meta: toMeta(node),
      children: resolved.menu.children ?? [],
    })
    routes.push({
      meta: toMeta(node),
      children: resolved.routes,
    })
  }

  return { diagnostics, menus, routes }
}

function resolveNode(node: AdminNavigationNode, diagnostics: string[]): ResolvedNavigationNode {
  if (node.type === 'menu') {
    return resolveMenuNode(node, diagnostics)
  }

  if (node.type === 'catalog' || node.type === 'group') {
    const children = node.children.map((child) => resolveNode(child, diagnostics))
    const menuChildren = children.flatMap((child) => (child.menu ? [child.menu] : []))
    if (menuChildren.length === 0) {
      return { routes: [] }
    }

    const firstPagePath = children.find((child) => child.firstPagePath)?.firstPagePath
    const routes = children.flatMap((child) => child.routes)
    const menu: Menu.recordRaw = {
      meta: toMeta(node),
      children: menuChildren,
    }

    if (node.type === 'group') {
      return { firstPagePath, menu, routes }
    }

    if (!hasNormalizedAbsolutePath(node, diagnostics)) {
      return { routes: [] }
    }

    return {
      firstPagePath,
      menu: { ...menu, path: node.path },
      routes: [
        {
          path: node.path,
          name: node.routeName,
          component: layoutLoader,
          redirect: firstPagePath,
          meta: toMeta(node),
          children: routes,
        },
      ],
    }
  }

  diagnostics.push(`Unsupported server navigation type for route "${node.routeName}".`)
  return { routes: [] }
}

function resolveMenuNode(node: AdminNavigationNode, diagnostics: string[]): ResolvedNavigationNode {
  if (!Object.hasOwn(adminPageRegistry, node.routeName)) {
    diagnostics.push(`Unregistered server navigation page route "${node.routeName}".`)
    return { routes: [] }
  }

  if (!hasNormalizedAbsolutePath(node, diagnostics)) {
    return { routes: [] }
  }

  const component = adminPageRegistry[node.routeName as keyof typeof adminPageRegistry]

  return {
    firstPagePath: node.path,
    menu: {
      path: node.path,
      meta: toMeta(node),
    },
    routes: [
      {
        path: node.path,
        name: node.routeName,
        component,
        meta: toMeta(node),
      },
    ],
  }
}

function hasNormalizedAbsolutePath(
  node: AdminNavigationNode,
  diagnostics: string[],
): node is AdminNavigationNode & {
  path: string
} {
  if (isNormalizedAbsoluteRoutePath(node.path)) return true

  diagnostics.push(
    `Server navigation route "${node.routeName}" must use a normalized absolute path.`,
  )
  return false
}

function isNormalizedAbsoluteRoutePath(path: unknown): path is string {
  if (
    typeof path !== 'string' ||
    !path.startsWith('/') ||
    path.startsWith('//') ||
    path.includes('\\') ||
    path.includes('%') ||
    path.includes('?') ||
    path.includes('#')
  ) {
    return false
  }

  const url = new URL(path, 'https://navigation.invalid')
  if (
    url.origin !== 'https://navigation.invalid' ||
    url.pathname !== path ||
    url.search !== '' ||
    url.hash !== ''
  ) {
    return false
  }

  if (path === '/') return true

  return path
    .split('/')
    .slice(1)
    .every((segment) => {
      return segment !== '' && segment !== '.' && segment !== '..'
    })
}

function toMeta(node: AdminNavigationNode) {
  return node.icon ? { title: node.title, icon: node.icon } : { title: node.title }
}
