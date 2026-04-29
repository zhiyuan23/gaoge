import type { TableColumn } from '@/components/common/EsTable/types'

import { PLAYER_PERMISSIONS } from '../auth'

export const PLAYER_TABLE_COLUMNS: TableColumn[] = [
  { label: '号码', prop: 'playerNumber', width: 88, align: 'center' },
  { label: '头像', prop: 'avatarUrl', width: 88, slot: 'avatar', align: 'center' },
  { label: '昵称', prop: 'nickname', width: 140 },
  { label: '真实姓名', prop: 'realName', width: 120 },
  { label: '分队', prop: 'subTeam', width: 120 },
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
