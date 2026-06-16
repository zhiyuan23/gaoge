import dayjs from 'dayjs'

import type { TableColumn } from '@/components/common/EsTable/types'

import { BANNER_PERMISSIONS } from '../auth'

export function formatDateTime(value: string | null) {
  if (!value) {
    return '-'
  }

  return dayjs(value).format('YYYY-MM-DD HH:mm')
}

export const BANNER_TABLE_COLUMNS: TableColumn[] = [
  { label: '排序', prop: 'dragSort', width: 72, slot: 'dragSort', align: 'center' },
  { label: '图片', prop: 'imageUrl', width: 130, slot: 'imageUrl', align: 'center' },
  { label: '标题', prop: 'title', minWidth: 180 },
  { label: '副标题', prop: 'subtitle', minWidth: 220, slot: 'subtitle' },
  { label: '跳转链接', prop: 'jumpUrl', minWidth: 240, slot: 'jumpUrl' },
  { label: '排序值', prop: 'sort', width: 90, align: 'center' },
  { label: '状态', prop: 'status', width: 100, slot: 'status', align: 'center' },
  { label: '更新时间', prop: 'updatedAt', width: 170, slot: 'updatedAt' },
  {
    label: '操作',
    prop: 'actions',
    fixed: 'right',
    align: 'center',
    actions: [
      {
        key: 'edit',
        label: '编辑',
        auth: BANNER_PERMISSIONS.update,
        type: 'primary',
      },
      {
        key: 'delete',
        label: '删除',
        auth: BANNER_PERMISSIONS.delete,
        type: 'danger',
      },
    ],
  },
]
