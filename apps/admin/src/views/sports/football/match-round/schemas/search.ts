import type { SearchField } from '@/components/common/EsSearch/types'

import {
  MATCH_ROUND_FILTER_YEAR_OPTIONS,
  MATCH_ROUND_ROUND_OPTIONS,
  MATCH_ROUND_SEASON_OPTIONS,
} from '../model/defaults'
import type { MatchRoundSearch } from '../model/types'

export function createMatchRoundSearchFields(defaultSearch: MatchRoundSearch): SearchField[] {
  const yearOptions =
    defaultSearch.year === ''
      ? MATCH_ROUND_FILTER_YEAR_OPTIONS
      : [
          { label: `${defaultSearch.year}年`, value: defaultSearch.year },
          ...MATCH_ROUND_FILTER_YEAR_OPTIONS.filter(
            (option) => option.value !== defaultSearch.year,
          ),
        ]

  return [
    {
      key: 'year',
      label: '年度',
      type: 'select',
      placeholder: '全部',
      defaultValue: defaultSearch.year,
      options: yearOptions,
      props: {
        clearable: true,
        valueOnClear: '',
      },
    },
    {
      key: 'season',
      label: '赛季',
      type: 'select',
      placeholder: '全部',
      defaultValue: defaultSearch.season,
      options: [...MATCH_ROUND_SEASON_OPTIONS],
      props: {
        clearable: true,
        valueOnClear: '',
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
