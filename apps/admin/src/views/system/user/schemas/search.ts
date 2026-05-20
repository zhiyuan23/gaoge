import type { SearchField } from '@/components/common/EsSearch/types'

export const SYSTEM_USER_STATUS_OPTIONS = [
  { label: '启用', value: 'active' },
  { label: '停用', value: 'inactive' },
]

export function createSystemUserSearchFields(
  roleOptions: { label: string; value: number }[],
): SearchField[] {
  return [
    {
      key: 'keyword',
      label: '关键词',
      type: 'input',
      placeholder: '账号 / 昵称',
    },
    {
      key: 'roleId',
      label: '角色',
      type: 'select',
      placeholder: '全部',
      options: roleOptions,
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
