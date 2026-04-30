export const MATCH_ROUND_PERMISSIONS = {
  create: 'matchRound:create',
  update: 'matchRound:update',
  delete: 'matchRound:delete',
} as const

export const MATCH_ROUND_MANAGE_PERMISSIONS = [
  MATCH_ROUND_PERMISSIONS.create,
  MATCH_ROUND_PERMISSIONS.update,
  MATCH_ROUND_PERMISSIONS.delete,
]
