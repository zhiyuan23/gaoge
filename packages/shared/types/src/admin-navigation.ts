export const ADMIN_PAGE_ROUTE_NAMES = [
  'player',
  'team',
  'matchRound',
  'assetRecord',
  'contentBanner',
  'contentRumorPost',
  'systemUser',
  'systemRole',
  'systemMenu',
  'systemAudit',
  'wechatShare',
] as const

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
