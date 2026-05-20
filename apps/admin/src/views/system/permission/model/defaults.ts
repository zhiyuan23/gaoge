import type { SystemPermission } from '@/api/system/permission'

import type { SystemPermissionFormModel, SystemPermissionSearch } from './types'

export const SYSTEM_PERMISSION_DEFAULT_SEARCH: SystemPermissionSearch = {
  keyword: '',
  module: '',
  status: '',
}

export function createEmptySystemPermissionForm(): SystemPermissionFormModel {
  return {
    code: '',
    name: '',
    description: '',
    status: 'active',
  }
}

export function createSystemPermissionFormFromRow(
  permission: SystemPermission,
): SystemPermissionFormModel {
  return {
    code: permission.code,
    name: permission.name,
    description: permission.description ?? '',
    status: permission.status,
  }
}
