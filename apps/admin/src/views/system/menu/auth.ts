export const SYSTEM_MENU_PERMISSIONS = {
  create: 'system.menu.create',
  update: 'system.menu.update',
  assignPermission: 'system.menu.assign-permission',
  delete: 'system.menu.delete',
} as const

export const SYSTEM_MENU_MANAGE_PERMISSIONS = [
  SYSTEM_MENU_PERMISSIONS.create,
  SYSTEM_MENU_PERMISSIONS.update,
  SYSTEM_MENU_PERMISSIONS.assignPermission,
  SYSTEM_MENU_PERMISSIONS.delete,
]
