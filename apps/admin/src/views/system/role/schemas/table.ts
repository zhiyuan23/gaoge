import type { TableColumn } from '@/components/common/EsTable/types'

import { SYSTEM_ROLE_PERMISSIONS } from '../auth'

export const SYSTEM_ROLE_TABLE_COLUMNS: TableColumn[] = [
  { label: '角色名称', prop: 'name', minWidth: 160 },
  { label: '角色编码', prop: 'code', minWidth: 160 },
  { label: '说明', prop: 'description', minWidth: 220 },
  { label: '绑定用户', prop: 'userCount', width: 96 },
  { label: '权限数', prop: 'permissionCount', width: 96 },
  { label: '排序', prop: 'sort', width: 88 },
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
        auth: SYSTEM_ROLE_PERMISSIONS.update,
        type: 'primary',
      },
      {
        key: 'assignPermission',
        label: '分配权限',
        auth: SYSTEM_ROLE_PERMISSIONS.assignPermission,
        type: 'primary',
      },
      {
        key: 'enable',
        label: '启用',
        auth: SYSTEM_ROLE_PERMISSIONS.enable,
        type: 'success',
        visible: (row) => row.status === 'inactive',
      },
      {
        key: 'disable',
        label: '停用',
        auth: SYSTEM_ROLE_PERMISSIONS.disable,
        type: 'warning',
        visible: (row) => row.status === 'active',
      },
      {
        key: 'delete',
        label: '删除',
        auth: SYSTEM_ROLE_PERMISSIONS.delete,
        type: 'danger',
      },
    ],
  },
]
