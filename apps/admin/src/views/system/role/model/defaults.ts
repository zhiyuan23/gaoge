import type { SystemRole } from '@/api/system/role'

import type { SystemRoleFormModel, SystemRoleSearch } from './types'

export const SYSTEM_ROLE_DEFAULT_SEARCH: SystemRoleSearch = {
  keyword: '',
  status: '',
}

export function createEmptySystemRoleForm(): SystemRoleFormModel {
  return {
    code: '',
    name: '',
    description: '',
    status: 'active',
    sort: 0,
  }
}

export function createSystemRoleFormFromRow(role: SystemRole): SystemRoleFormModel {
  return {
    code: role.code,
    name: role.name,
    description: role.description ?? '',
    status: role.status,
    sort: role.sort,
  }
}
