export const TEAM_PERMISSIONS = {
  create: 'team:create',
  update: 'team:update',
  delete: 'team:delete',
} as const

export const TEAM_MANAGE_PERMISSIONS = [
  TEAM_PERMISSIONS.create,
  TEAM_PERMISSIONS.update,
  TEAM_PERMISSIONS.delete,
]
