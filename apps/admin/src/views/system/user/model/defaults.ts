import type { SystemUser } from '@/api/system/user'

import type { SystemUserFormModel, SystemUserSearch } from './types'

export const SYSTEM_USER_DEFAULT_SEARCH: SystemUserSearch = {
  keyword: '',
  role: '',
  status: '',
}

export function createEmptySystemUserForm(): SystemUserFormModel {
  return {
    account: '',
    password: '',
    nickname: '',
    avatarUrl: '',
    role: 'user',
    status: 'active',
  }
}

export function createSystemUserFormFromRow(user: SystemUser): SystemUserFormModel {
  return {
    account: user.account,
    password: '',
    nickname: user.nickname ?? '',
    avatarUrl: user.avatarUrl ?? '',
    role: user.role,
    status: user.status,
  }
}
