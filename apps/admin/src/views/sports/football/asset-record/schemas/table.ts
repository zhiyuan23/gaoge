import dayjs from 'dayjs'

import type { TableColumn } from '@/components/common/EsTable/types'

import { ASSET_RECORD_PERMISSIONS } from '../auth'

export function formatDateTime(value: string | null) {
  if (!value) {
    return '-'
  }

  return dayjs(value).format('YYYY-MM-DD HH:mm')
}

export function formatDate(value: string | null) {
  if (!value) {
    return '-'
  }

  return dayjs(value).format('YYYY-MM-DD')
}

export function formatCurrency(value: number | null) {
  if (typeof value !== 'number') {
    return '-'
  }

  return `¥${(value / 100).toFixed(2)}`
}

export function formatSignedCurrency(direction: string, value: number | null) {
  if (typeof value !== 'number') {
    return '-'
  }

  const prefix = direction === 'income' ? '+' : '-'
  return `${prefix}${formatCurrency(value)}`
}

export const ASSET_RECORD_TABLE_COLUMNS: TableColumn[] = [
  { label: '记录日期', prop: 'recordDate', width: 120, slot: 'recordDate' },
  { label: '标题', prop: 'title', width: 200 },
  { label: '金额', prop: 'amount', width: 110, slot: 'amount', align: 'right' },
  { label: '方向', prop: 'direction', width: 92, slot: 'direction', align: 'center' },
  { label: '类型', prop: 'recordType', width: 110, slot: 'recordType', align: 'center' },
  { label: '场次标签', prop: 'matchLabel', width: 180 },
  { label: '备注', prop: 'description', width: 300 },
  { label: '创建时间', prop: 'createdAt', width: 170, slot: 'createdAt' },
  { label: '更新时间', prop: 'updatedAt', width: 170, slot: 'updatedAt' },
  {
    label: '操作',
    prop: 'actions',
    fixedWidth: 120,
    fixed: 'right',
    align: 'center',
    actions: [
      { key: 'edit', label: '编辑', auth: ASSET_RECORD_PERMISSIONS.update, type: 'primary' },
      { key: 'delete', label: '删除', auth: ASSET_RECORD_PERMISSIONS.delete, type: 'danger' },
    ],
  },
]
