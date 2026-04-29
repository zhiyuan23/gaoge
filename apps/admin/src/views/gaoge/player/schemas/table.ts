import dayjs from 'dayjs'

import type { TableColumn } from '@/components/common/EsTable/types'

import { PLAYER_PERMISSIONS } from '../auth'

export function formatDateTime(value: string | null) {
  if (!value) {
    return '-'
  }
  return dayjs(value).format('YYYY-MM-DD HH:mm')
}

export function formatBirthDate(value: string | null) {
  if (!value) {
    return '-'
  }
  return dayjs(value).format('YYYY-MM-DD')
}

export const PLAYER_TABLE_COLUMNS: TableColumn[] = [
  { label: '头像', prop: 'avatarUrl', width: 88, slot: 'avatar', align: 'center' },
  { label: '昵称', prop: 'nickname', width: 140 },
  { label: '真实姓名', prop: 'realName', width: 120 },
  { label: 'OpenID', prop: 'openid', width: 220 },
  { label: '分队', prop: 'subTeam', width: 120 },
  { label: '位置', prop: 'position', width: 120 },
  { label: '球衣尺码', prop: 'jerseySize', width: 110, align: 'center' },
  { label: '状态', prop: 'status', width: 110, slot: 'status', align: 'center' },
  { label: '管理员', prop: 'isAdmin', width: 100, slot: 'isAdmin', align: 'center' },
  { label: '生日', prop: 'birthDate', width: 120, slot: 'birthDate', align: 'center' },
  { label: '更新时间', prop: 'updatedAt', width: 170, slot: 'updatedAt' },
  { label: '备注', prop: 'remark', width: 180 },
  {
    label: '操作',
    prop: 'actions',
    width: 96,
    fixed: 'right',
    align: 'center',
    actions: [
      { key: 'edit', label: '编辑', auth: PLAYER_PERMISSIONS.update, type: 'primary' },
      { key: 'delete', label: '删除', auth: PLAYER_PERMISSIONS.delete, type: 'danger' },
    ],
  },
]
