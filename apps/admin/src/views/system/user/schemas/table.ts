import dayjs from 'dayjs'

import type { TableColumn } from '@/components/common/EsTable/types'

import { SYSTEM_USER_PERMISSIONS } from '../auth'

export function formatDateTime(value: string | null) {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-'
}

export const SYSTEM_USER_TABLE_COLUMNS: TableColumn[] = [
  { label: '账号', prop: 'account' },
  { label: '角色', prop: 'role', slot: 'role' },
  { label: '昵称', prop: 'nickname' },
  { label: '状态', prop: 'status', slot: 'status' },
  { label: '最近登录', prop: 'lastLoginAt', slot: 'lastLoginAt' },
  { label: '创建时间', prop: 'createdAt', slot: 'createdAt' },
  {
    label: '操作',
    prop: 'actions',
    fixed: 'right',
    align: 'center',
    actions: [
      {
        key: 'edit',
        label: '编辑',
        auth: SYSTEM_USER_PERMISSIONS.update,
        type: 'primary',
      },
      {
        key: 'enable',
        label: '启用',
        auth: SYSTEM_USER_PERMISSIONS.enable,
        type: 'success',
      },
      {
        key: 'disable',
        label: '停用',
        auth: SYSTEM_USER_PERMISSIONS.disable,
        type: 'warning',
      },
      {
        key: 'resetPassword',
        label: '重置密码',
        auth: SYSTEM_USER_PERMISSIONS.resetPassword,
        type: 'primary',
      },
      {
        key: 'delete',
        label: '删除',
        auth: SYSTEM_USER_PERMISSIONS.delete,
        type: 'danger',
      },
    ],
  },
]
