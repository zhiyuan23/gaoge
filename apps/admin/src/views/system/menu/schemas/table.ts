import type { TableColumn } from '@/components/common/EsTable/types'

import { SYSTEM_MENU_PERMISSIONS } from '../auth'

export const SYSTEM_MENU_TABLE_COLUMNS: TableColumn[] = [
  { label: '菜单标题', prop: 'title', minWidth: 180 },
  { label: '菜单标识', prop: 'name', minWidth: 160 },
  { label: '路径', prop: 'path', minWidth: 180 },
  { label: '路由名', prop: 'routeName', minWidth: 160 },
  { label: '类型', prop: 'menuType', width: 100 },
  { label: '排序', prop: 'sort', width: 80 },
  {
    label: '状态',
    prop: 'status',
    slot: 'status',
    width: 96,
  },
  {
    label: '可见',
    prop: 'visible',
    slot: 'visible',
    width: 88,
  },
  {
    label: '操作',
    prop: 'actions',
    fixedWidth: 120,
    fixed: 'right',
    align: 'center',
    actions: [
      {
        key: 'createSub',
        label: '新增子菜单',
        auth: SYSTEM_MENU_PERMISSIONS.create,
        type: 'primary',
      },
      {
        key: 'edit',
        label: '编辑',
        auth: SYSTEM_MENU_PERMISSIONS.update,
        type: 'primary',
      },
      {
        key: 'assignPermission',
        label: '绑定权限',
        auth: SYSTEM_MENU_PERMISSIONS.assignPermission,
        type: 'primary',
      },
      {
        key: 'delete',
        label: '删除',
        auth: SYSTEM_MENU_PERMISSIONS.delete,
        type: 'danger',
      },
    ],
  },
]
