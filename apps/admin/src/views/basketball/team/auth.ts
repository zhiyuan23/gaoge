export const TEAM_PERMISSIONS = {
  view: 'basketball.team.view',
  create: 'basketball.team.create',
  update: 'basketball.team.update',
  delete: 'basketball.team.delete',
} as const

export const TEAM_MANAGE_PERMISSIONS = [
  TEAM_PERMISSIONS.create,
  TEAM_PERMISSIONS.update,
  TEAM_PERMISSIONS.delete,
]
