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
