export const TEAM_PERMISSIONS = {
  view: 'football.team.view',
  create: 'football.team.create',
  update: 'football.team.update',
  delete: 'football.team.delete',
} as const

export const TEAM_MANAGE_PERMISSIONS = [
  TEAM_PERMISSIONS.create,
  TEAM_PERMISSIONS.update,
  TEAM_PERMISSIONS.delete,
]
