import type { AdminNavigationNode } from '@gaoge/shared-types'

import type { Menu, Route } from '#/global'

interface ResolvedServerNavigation {
  diagnostics: string[]
  menus: Menu.recordMainRaw[]
  routes: Route.recordMainRaw[]
}

export interface ServerNavigationInitializationDependencies {
  fetchNavigation: () => Promise<AdminNavigationNode[]>
  reportDiagnostics: (diagnostics: string[]) => void
  resolveNavigation: (navigation: AdminNavigationNode[]) => ResolvedServerNavigation
  setMenus: (menus: Menu.recordMainRaw[]) => void
  setRoutes: (routes: Route.recordMainRaw[]) => void
}

export async function initializeServerNavigation({
  fetchNavigation,
  reportDiagnostics,
  resolveNavigation,
  setMenus,
  setRoutes,
}: ServerNavigationInitializationDependencies) {
  try {
    const navigation = await fetchNavigation()
    const resolved = resolveNavigation(navigation)
    setRoutes(resolved.routes)
    setMenus(resolved.menus)
    reportDiagnostics(resolved.diagnostics)
  } catch (error) {
    setRoutes([])
    setMenus([])
    throw error
  }
}
