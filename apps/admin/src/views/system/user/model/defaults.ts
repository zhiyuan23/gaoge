import type { SystemUser } from '@/api/system/user'

import type { SystemUserFormModel, SystemUserSearch } from './types'

export const SYSTEM_USER_DEFAULT_SEARCH: SystemUserSearch = {
  keyword: '',
  roleId: '',
  status: '',
}

export function createEmptySystemUserForm(): SystemUserFormModel {
  return {
    account: '',
    password: '',
    nickname: '',
    avatarUrl: '',
    roleIds: [],
    status: 'active',
  }
}

export function createSystemUserFormFromRow(user: SystemUser): SystemUserFormModel {
  return {
    account: user.account,
    password: '',
    nickname: user.nickname ?? '',
    avatarUrl: user.avatarUrl ?? '',
    roleIds: user.roles.map((role) => role.id),
    status: user.status,
  }
}
