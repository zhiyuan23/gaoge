import dayjs from 'dayjs'

import type { MatchRound } from '@/api/match-rounds'
import type { TableColumn } from '@/components/common/EsTable/types'

import { MATCH_ROUND_PERMISSIONS } from '../auth'

export function formatDateTime(value: string | null) {
  if (!value) {
    return '-'
  }

  return dayjs(value).format('YYYY-MM-DD HH:mm')
}

export function formatMatchDate(value: string | null) {
  if (!value) {
    return '-'
  }

  return dayjs(value).format('YYYY-MM-DD')
}

export function formatResultSummary(row: MatchRound) {
  return row.results
    .map((item) => `${item.teamName ?? `球队${item.teamId}`} / 第${item.rank}名 / ${item.points}分`)
    .join('；')
}

export const MATCH_ROUND_TABLE_COLUMNS: TableColumn[] = [
  { label: '比赛日期', prop: 'matchDate', width: 120, slot: 'matchDate' },
  { label: '场地', prop: 'venue', width: 180 },
  { label: '备注', prop: 'remark', width: 220 },
  { label: '本场结果摘要', prop: 'results', minWidth: 360, slot: 'resultSummary' } as TableColumn,
  { label: '创建时间', prop: 'createdAt', width: 170, slot: 'createdAt' },
  { label: '更新时间', prop: 'updatedAt', width: 170, slot: 'updatedAt' },
  {
    label: '操作',
    prop: 'actions',
    width: 96,
    fixed: 'right',
    align: 'center',
    actions: [
      { key: 'edit', label: '编辑', auth: MATCH_ROUND_PERMISSIONS.update, type: 'primary' },
      { key: 'delete', label: '删除', auth: MATCH_ROUND_PERMISSIONS.delete, type: 'danger' },
    ],
  },
]
