import { ADMIN_PAGE_ROUTE_NAMES } from './admin-page-route-names.js'

export { ADMIN_PAGE_ROUTE_NAMES }

export type AdminPageRouteName = (typeof ADMIN_PAGE_ROUTE_NAMES)[number]

export type SystemMenuType = 'group' | 'catalog' | 'menu'

export interface AdminNavigationNode {
  routeName: string
  type: SystemMenuType
  path: string | null
  title: string
  icon: string | null
  children: AdminNavigationNode[]
}
