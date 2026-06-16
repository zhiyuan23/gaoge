/** 足球业务 — 管理员权限 */
export const footballAdminPermissions = [
  'football.assetRecord.view',
  'football.assetRecord.create',
  'football.assetRecord.update',
  'football.assetRecord.delete',
  'football.player.create',
  'football.player.update',
  'football.player.delete',
  'football.team.create',
  'football.team.update',
  'football.team.delete',
  'football.matchRound.create',
  'football.matchRound.update',
  'football.matchRound.delete',
  'football.fund.create',
  'football.fund.update',
  'football.fund.delete',
] as const

/** 足球业务 — 浏览者（只读）权限 */
export const footballViewerPermissions = [
  'football.assetRecord.view',
  'football.player.view',
  'football.team.view',
  'football.matchRound.view',
  'football.fund.view',
] as const

/** 篮球业务 — 管理员权限 */
export const basketballAdminPermissions = [
  'basketball.assetRecord.view',
  'basketball.assetRecord.create',
  'basketball.assetRecord.update',
  'basketball.assetRecord.delete',
  'basketball.player.create',
  'basketball.player.update',
  'basketball.player.delete',
  'basketball.team.create',
  'basketball.team.update',
  'basketball.team.delete',
  'basketball.matchRound.create',
  'basketball.matchRound.update',
  'basketball.matchRound.delete',
  'basketball.fund.create',
  'basketball.fund.update',
  'basketball.fund.delete',
] as const

/** 篮球业务 — 浏览者（只读）权限 */
export const basketballViewerPermissions = [
  'basketball.assetRecord.view',
  'basketball.player.view',
  'basketball.team.view',
  'basketball.matchRound.view',
  'basketball.fund.view',
] as const

/** 系统管理权限 */
export const systemPermissions = [
  'system.user.view',
  'system.user.create',
  'system.user.update',
  'system.user.enable',
  'system.user.disable',
  'system.user.reset-password',
  'system.user.delete',
  'system.role.view',
  'system.menu.view',
  'system.permission.view',
] as const

/** 内容管理 — 管理员权限 */
export const contentAdminPermissions = [
  'content.rumorPost.view',
  'content.rumorPost.create',
  'content.rumorPost.update',
  'content.rumorPost.delete',
  'content.rumorPost.publish',
  'content.banner.view',
  'content.banner.create',
  'content.banner.update',
  'content.banner.delete',
] as const

/** 内容管理 — 浏览者（只读）权限 */
export const contentViewerPermissions = ['content.rumorPost.view', 'content.banner.view'] as const
