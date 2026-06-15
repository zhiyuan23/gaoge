import type { SearchField } from '@/components/common/EsSearch/types'

import {
  MATCH_ROUND_FILTER_YEAR_OPTIONS,
  MATCH_ROUND_ROUND_OPTIONS,
  MATCH_ROUND_SEASON_OPTIONS,
} from '../model/defaults'

export function createMatchRoundSearchFields(): SearchField[] {
  return [
    {
      key: 'year',
      label: '年度',
      type: 'select',
      placeholder: '全部',
      options: MATCH_ROUND_FILTER_YEAR_OPTIONS,
      props: {
        clearable: true,
      },
    },
    {
      key: 'season',
      label: '赛季',
      type: 'select',
      placeholder: '全部',
      options: [...MATCH_ROUND_SEASON_OPTIONS],
      props: {
        clearable: true,
      },
    },
    {
      key: 'round',
      label: '场次',
      type: 'select',
      placeholder: '全部',
      options: MATCH_ROUND_ROUND_OPTIONS,
      props: {
        clearable: true,
      },
    },
    {
      key: 'matchDate',
      label: '日期',
      type: 'date',
      placeholder: '请选择比赛日期',
    },
    {
      key: 'venueKeyword',
      label: '场地',
      type: 'input',
      placeholder: '请输入场地关键词',
    },
  ]
}
