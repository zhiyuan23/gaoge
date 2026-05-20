export const SYSTEM_ROLE_PERMISSIONS = {
  create: 'system.role.create',
  update: 'system.role.update',
  assignPermission: 'system.role.assign-permission',
  enable: 'system.role.enable',
  disable: 'system.role.disable',
  delete: 'system.role.delete',
} as const

export const SYSTEM_ROLE_MANAGE_PERMISSIONS = [
  SYSTEM_ROLE_PERMISSIONS.create,
  SYSTEM_ROLE_PERMISSIONS.update,
  SYSTEM_ROLE_PERMISSIONS.assignPermission,
  SYSTEM_ROLE_PERMISSIONS.enable,
  SYSTEM_ROLE_PERMISSIONS.disable,
  SYSTEM_ROLE_PERMISSIONS.delete,
]
