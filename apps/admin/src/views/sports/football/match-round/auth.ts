export const MATCH_ROUND_PERMISSIONS = {
  view: 'football.matchRound.view',
  create: 'football.matchRound.create',
  update: 'football.matchRound.update',
  delete: 'football.matchRound.delete',
} as const

export const MATCH_ROUND_MANAGE_PERMISSIONS = [
  MATCH_ROUND_PERMISSIONS.create,
  MATCH_ROUND_PERMISSIONS.update,
  MATCH_ROUND_PERMISSIONS.delete,
]
