import type { TableColumn } from '@/components/common/EsTable/types'

export const SYSTEM_AUDIT_TABLE_COLUMNS: TableColumn[] = [
  { label: '时间', prop: 'createdAt', minWidth: 180, slot: 'createdAt' },
  { label: '操作者', prop: 'actor', minWidth: 150, slot: 'actor' },
  { label: '操作', prop: 'action', minWidth: 190 },
  { label: '实体', prop: 'entity', minWidth: 190, slot: 'entity' },
  { label: '结果', prop: 'result', fixedWidth: 110, slot: 'result' },
  { label: '请求编号', prop: 'requestId', minWidth: 180, slot: 'requestId' },
  {
    label: '操作',
    prop: 'actions',
    fixedWidth: 90,
    fixed: 'right',
    align: 'center',
    actions: [{ key: 'detail', label: '详情', type: 'primary' }],
  },
]
