export const PLAYER_PERMISSIONS = {
  create: 'player:create',
  update: 'player:update',
  delete: 'player:delete',
} as const

export const PLAYER_MANAGE_PERMISSIONS = [
  PLAYER_PERMISSIONS.create,
  PLAYER_PERMISSIONS.update,
  PLAYER_PERMISSIONS.delete,
]
