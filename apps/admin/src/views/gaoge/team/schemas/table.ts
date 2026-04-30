import dayjs from 'dayjs'

import type { TableColumn } from '@/components/common/EsTable/types'

import { TEAM_PERMISSIONS } from '../auth'

export function formatDateTime(value: string | null) {
  if (!value) {
    return '-'
  }

  return dayjs(value).format('YYYY-MM-DD HH:mm')
}

export const TEAM_TABLE_COLUMNS: TableColumn[] = [
  { label: '名称', prop: 'name', width: 160 },
  { label: 'Slogan', prop: 'slogan', width: 180 },
  { label: '赞助商名称', prop: 'sponsorName', width: 180 },
  { label: '排序', prop: 'sort', width: 100, align: 'center' },
  { label: '创建时间', prop: 'createdAt', width: 170, slot: 'createdAt' },
  { label: '更新时间', prop: 'updatedAt', width: 170, slot: 'updatedAt' },
  {
    label: '操作',
    prop: 'actions',
    width: 96,
    fixed: 'right',
    align: 'center',
    actions: [
      { key: 'edit', label: '编辑', auth: TEAM_PERMISSIONS.update, type: 'primary' },
      { key: 'delete', label: '删除', auth: TEAM_PERMISSIONS.delete, type: 'danger' },
    ],
  },
]
