import dayjs from 'dayjs'

import type { TableColumn } from '@/components/common/EsTable/types'

export function formatDateTime(value: string | null) {
  if (!value) {
    return '-'
  }

  return dayjs(value).format('YYYY-MM-DD HH:mm')
}

export const BANNER_TABLE_COLUMNS: TableColumn[] = [
  { label: '图片', prop: 'imageUrl', width: 120, slot: 'imageUrl', align: 'center' },
  { label: '标题', prop: 'title', minWidth: 180 },
  { label: '跳转类型', prop: 'jumpType', width: 120, slot: 'jumpType', align: 'center' },
  { label: '跳转链接', prop: 'jumpUrl', minWidth: 240, slot: 'jumpUrl' },
  { label: '排序', prop: 'sort', width: 90, align: 'center' },
  { label: '状态', prop: 'status', width: 100, slot: 'status', align: 'center' },
  { label: '更新时间', prop: 'updatedAt', width: 170, slot: 'updatedAt' },
]
