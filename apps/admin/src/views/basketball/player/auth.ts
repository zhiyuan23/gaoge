export const PLAYER_PERMISSIONS = {
  view: 'basketball.player.view',
  create: 'basketball.player.create',
  update: 'basketball.player.update',
  delete: 'basketball.player.delete',
} as const

export const PLAYER_MANAGE_PERMISSIONS = [
  PLAYER_PERMISSIONS.create,
  PLAYER_PERMISSIONS.update,
  PLAYER_PERMISSIONS.delete,
]
