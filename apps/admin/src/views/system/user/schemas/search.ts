import type { SearchField } from '@/components/common/EsSearch/types'

import { ADMIN_ROLE_OPTIONS } from '../constants'

export const SYSTEM_USER_ROLE_OPTIONS = [
  ...ADMIN_ROLE_OPTIONS,
  { label: '普通用户', value: 'user' },
]

export const SYSTEM_USER_STATUS_OPTIONS = [
  { label: '启用', value: 'active' },
  { label: '停用', value: 'inactive' },
]

export function createSystemUserSearchFields(): SearchField[] {
  return [
    {
      key: 'keyword',
      label: '关键词',
      type: 'input',
      placeholder: '账号 / 昵称',
    },
    {
      key: 'role',
      label: '角色',
      type: 'select',
      placeholder: '全部',
      options: SYSTEM_USER_ROLE_OPTIONS,
    },
    {
      key: 'status',
      label: '状态',
      type: 'select',
      placeholder: '全部',
      options: SYSTEM_USER_STATUS_OPTIONS,
    },
  ]
}
