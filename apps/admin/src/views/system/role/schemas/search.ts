import type { SearchField } from '@/components/common/EsSearch/types'

export const SYSTEM_ROLE_STATUS_OPTIONS = [
  { label: '启用', value: 'active' },
  { label: '停用', value: 'inactive' },
]

export function createSystemRoleSearchFields(): SearchField[] {
  return [
    {
      key: 'keyword',
      label: '关键词',
      type: 'input',
      placeholder: '角色名称 / 角色编码',
    },
    {
      key: 'status',
      label: '状态',
      type: 'select',
      placeholder: '全部',
      options: SYSTEM_ROLE_STATUS_OPTIONS,
    },
  ]
}
