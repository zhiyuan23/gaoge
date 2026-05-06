export const SYSTEM_USER_PERMISSIONS = {
  create: 'system.user.create',
  update: 'system.user.update',
  enable: 'system.user.enable',
  disable: 'system.user.disable',
  resetPassword: 'system.user.reset-password',
  delete: 'system.user.delete',
} as const

export const SYSTEM_USER_MANAGE_PERMISSIONS = [
  SYSTEM_USER_PERMISSIONS.create,
  SYSTEM_USER_PERMISSIONS.update,
  SYSTEM_USER_PERMISSIONS.resetPassword,
  SYSTEM_USER_PERMISSIONS.enable,
  SYSTEM_USER_PERMISSIONS.disable,
  SYSTEM_USER_PERMISSIONS.delete,
]
