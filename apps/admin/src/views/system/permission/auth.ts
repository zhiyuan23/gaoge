export const SYSTEM_PERMISSION_PERMISSIONS = {
  create: 'system.permission.create',
  update: 'system.permission.update',
  delete: 'system.permission.delete',
  syncBuiltIns: 'system.permission.sync-builtins',
} as const

export const SYSTEM_PERMISSION_MANAGE_PERMISSIONS = [
  SYSTEM_PERMISSION_PERMISSIONS.create,
  SYSTEM_PERMISSION_PERMISSIONS.update,
  SYSTEM_PERMISSION_PERMISSIONS.delete,
  SYSTEM_PERMISSION_PERMISSIONS.syncBuiltIns,
]
