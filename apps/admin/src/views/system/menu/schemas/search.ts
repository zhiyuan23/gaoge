import type { SearchField } from '@/components/common/EsSearch/types'

export const SYSTEM_MENU_TYPE_OPTIONS = [
  { label: '目录', value: 'catalog' },
  { label: '菜单', value: 'menu' },
]

export const SYSTEM_MENU_STATUS_OPTIONS = [
  { label: '启用', value: 'active' },
  { label: '停用', value: 'inactive' },
]

export function createSystemMenuSearchFields(): SearchField[] {
  return [
    {
      key: 'keyword',
      label: '关键词',
      type: 'input',
      placeholder: '菜单标题 / 菜单标识',
    },
    {
      key: 'menuType',
      label: '类型',
      type: 'select',
      placeholder: '全部',
      options: SYSTEM_MENU_TYPE_OPTIONS,
    },
    {
      key: 'status',
      label: '状态',
      type: 'select',
      placeholder: '全部',
      options: SYSTEM_MENU_STATUS_OPTIONS,
    },
  ]
}
