import type { SearchField, SearchOption } from '@/components/common/EsSearch/types'

import { PLAYER_STATUS_OPTIONS } from './form'

export const PLAYER_SUB_TEAM_OPTIONS: SearchOption[] = [
  { label: '皇家高歌', value: '皇家高歌' },
  { label: '高歌国际', value: '高歌国际' },
  { label: '高歌联', value: '高歌联' },
]

export interface PlayerSearchFieldContext {
  subTeamOptions: () => SearchOption[]
}

export function createPlayerOptionList(values: Array<string | null | undefined>): SearchOption[] {
  return Array.from(
    new Set(values.filter((value): value is string => Boolean(value && value.trim()))),
  ).map((value) => ({
    label: value,
    value,
  }))
}

export function mergePlayerStatusOptions(dynamicOptions: SearchOption[]): SearchOption[] {
  const options = [...PLAYER_STATUS_OPTIONS]

  dynamicOptions.forEach((item) => {
    if (!options.some((option) => option.value === item.value)) {
      options.push(item)
    }
  })

  return options
}

export function createPlayerSearchFields(ctx: PlayerSearchFieldContext): SearchField[] {
  return [
    {
      key: 'keyword',
      label: '关键词',
      type: 'input',
      placeholder: '昵称 / 号码',
    },
    {
      key: 'subTeam',
      label: '分队',
      type: 'select',
      placeholder: '全部',
      options: ctx.subTeamOptions,
      props: {
        filterable: true,
        clearable: true,
      },
    },
  ]
}
