import dayjs from 'dayjs'

import type { MatchRound } from '@/api/football/match-round'
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

export function formatRound(value: number | null) {
  if (!value) {
    return '-'
  }

  return `第${value}轮`
}

function findRankResult(row: MatchRound, rank: 1 | 2 | 3) {
  return row.results.find((item) => item.rank === rank)
}

function getRankTeamName(row: MatchRound, rank: 1 | 2 | 3) {
  const item = findRankResult(row, rank)

  if (!item) {
    return '-'
  }

  return item.teamName ?? `球队${item.teamId}`
}

export function formatChampion(row: MatchRound) {
  return getRankTeamName(row, 1)
}

export function formatRunnerUp(row: MatchRound) {
  return getRankTeamName(row, 2)
}

export function formatThirdPlace(row: MatchRound) {
  return getRankTeamName(row, 3)
}

export function getTeamTagClass(teamName: string) {
  if (teamName === '皇家高歌') {
    return 'team-tag color-white bg-amber-400'
  }

  if (teamName === '高歌国际') {
    return 'team-tag color-white bg-blue-400'
  }

  if (teamName === '高歌联') {
    return 'team-tag color-white bg-red-400'
  }

  return 'team-tag'
}

export const MATCH_ROUND_TABLE_COLUMNS: TableColumn[] = [
  { label: '年度', prop: 'year', width: 90, align: 'center' },
  { label: '赛季', prop: 'season', width: 100, align: 'center' },
  { label: '场次', prop: 'round', width: 100, slot: 'round', align: 'center' },
  { label: '比赛日期', prop: 'matchDate', width: 120, slot: 'matchDate' },
  { label: '场地', prop: 'venue', width: 180 },
  { label: '冠军', prop: 'champion', width: 180, slot: 'champion' },
  { label: '亚军', prop: 'runnerUp', width: 180, slot: 'runnerUp' },
  { label: '季军', prop: 'thirdPlace', width: 180, slot: 'thirdPlace' },
  { label: '备注', prop: 'remark', width: 220 },
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
