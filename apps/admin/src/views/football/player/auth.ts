export const PLAYER_PERMISSIONS = {
  view: 'football.player.view',
  create: 'football.player.create',
  update: 'football.player.update',
  delete: 'football.player.delete',
} as const

export const PLAYER_MANAGE_PERMISSIONS = [
  PLAYER_PERMISSIONS.create,
  PLAYER_PERMISSIONS.update,
  PLAYER_PERMISSIONS.delete,
]
