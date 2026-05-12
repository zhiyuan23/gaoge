export const MATCH_ROUND_PERMISSIONS = {
  view: 'basketball.matchRound.view',
  create: 'basketball.matchRound.create',
  update: 'basketball.matchRound.update',
  delete: 'basketball.matchRound.delete',
} as const

export const MATCH_ROUND_MANAGE_PERMISSIONS = [
  MATCH_ROUND_PERMISSIONS.create,
  MATCH_ROUND_PERMISSIONS.update,
  MATCH_ROUND_PERMISSIONS.delete,
]
