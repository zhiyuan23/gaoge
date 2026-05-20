import type { TableColumn } from '@/components/common/EsTable/types'

import { SYSTEM_PERMISSION_PERMISSIONS } from '../auth'

export const SYSTEM_PERMISSION_TABLE_COLUMNS: TableColumn[] = [
  { label: '权限名称', prop: 'name', minWidth: 180 },
  { label: '权限码', prop: 'code', minWidth: 240 },
  { label: '模块', prop: 'module', width: 120 },
  { label: '资源', prop: 'resource', width: 140 },
  { label: '动作', prop: 'action', width: 140 },
  { label: '说明', prop: 'description', minWidth: 220 },
  {
    label: '状态',
    prop: 'status',
    slot: 'status',
    width: 96,
  },
  {
    label: '内置',
    prop: 'isBuiltIn',
    slot: 'isBuiltIn',
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
        key: 'edit',
        label: '编辑',
        auth: SYSTEM_PERMISSION_PERMISSIONS.update,
        type: 'primary',
      },
      {
        key: 'delete',
        label: '删除',
        auth: SYSTEM_PERMISSION_PERMISSIONS.delete,
        type: 'danger',
        visible: (row) => !row.isBuiltIn,
      },
    ],
  },
]
