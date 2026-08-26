import type { RouteRecordRaw } from 'vue-router'

import type { AdminPageRouteName } from '@gaoge/shared-types'

export type ComponentLoader = NonNullable<RouteRecordRaw['component']>

export const adminPageRegistry: Record<AdminPageRouteName, ComponentLoader> = {
  player: () => import('@/views/sports/football/player/index.vue'),
  team: () => import('@/views/sports/football/team/index.vue'),
  matchRound: () => import('@/views/sports/football/match-round/index.vue'),
  assetRecord: () => import('@/views/sports/football/asset-record/index.vue'),
  contentBanner: () => import('@/views/sports/content/banner/index.vue'),
  contentRumorPost: () => import('@/views/sports/content/rumor-post/index.vue'),
  systemUser: () => import('@/views/system/user/workspace.vue'),
  systemRole: () => import('@/views/system/role/workspace.vue'),
  systemMenu: () => import('@/views/system/menu/workspace.vue'),
  systemAudit: () => import('@/views/system/audit/index.vue'),
  wechatShare: () => import('@/views/system/wechat-share/index.vue'),
}
