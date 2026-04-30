import type { SearchField } from '@/components/common/EsSearch/types'

export function createMatchRoundSearchFields(): SearchField[] {
  return [
    {
      key: 'matchDate',
      label: '比赛日期',
      type: 'date',
      placeholder: '请选择比赛日期',
    },
    {
      key: 'venueKeyword',
      label: '场地关键词',
      type: 'input',
      placeholder: '请输入场地关键词',
    },
  ]
}
