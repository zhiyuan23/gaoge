import type { SearchField } from '@/components/common/EsSearch/types'

export const SYSTEM_PERMISSION_STATUS_OPTIONS = [
  { label: '启用', value: 'active' },
  { label: '停用', value: 'inactive' },
]

export function createSystemPermissionSearchFields(
  moduleOptions: { label: string; value: string }[],
): SearchField[] {
  return [
    {
      key: 'keyword',
      label: '关键词',
      type: 'input',
      placeholder: '权限码 / 名称',
    },
    {
      key: 'module',
      label: '模块',
      type: 'select',
      placeholder: '全部',
      options: moduleOptions,
    },
    {
      key: 'status',
      label: '状态',
      type: 'select',
      placeholder: '全部',
      options: SYSTEM_PERMISSION_STATUS_OPTIONS,
    },
  ]
}
