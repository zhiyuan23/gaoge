import dayjs from 'dayjs'

import type { TableColumn } from '@/components/common/EsTable/types'

import { MESSAGE_BOARD_POST_PERMISSIONS } from '../auth'

export function formatDateTime(value: string | null) {
  if (!value) {
    return '-'
  }

  return dayjs(value).format('YYYY-MM-DD HH:mm')
}

export const MESSAGE_BOARD_POST_TABLE_COLUMNS: TableColumn[] = [
  { label: '标题', prop: 'title', minWidth: 180 },
  { label: '标签', prop: 'tags', width: 180, slot: 'tags' },
  { label: '来源', prop: 'sourceName', minWidth: 160, slot: 'sourceName' },
  { label: '状态', prop: 'status', width: 100, slot: 'status', align: 'center' },
  { label: '置顶', prop: 'isPinned', width: 90, slot: 'isPinned', align: 'center' },
  { label: '发布时间', prop: 'publishedAt', width: 170, slot: 'publishedAt' },
  { label: '更新时间', prop: 'updatedAt', width: 170, slot: 'updatedAt' },
  {
    label: '操作',
    prop: 'actions',
    fixed: 'right',
    align: 'center',
    actions: [
      {
        key: 'publish',
        label: '发布',
        auth: MESSAGE_BOARD_POST_PERMISSIONS.publish,
        type: 'success',
        visible: (row: { status: string }) => row.status === 'draft',
      },
      {
        key: 'edit',
        label: '编辑',
        auth: MESSAGE_BOARD_POST_PERMISSIONS.update,
        type: 'primary',
      },
      {
        key: 'delete',
        label: '删除',
        auth: MESSAGE_BOARD_POST_PERMISSIONS.delete,
        type: 'danger',
      },
    ],
  },
]
