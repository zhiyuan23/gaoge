import type { SearchField, SearchOption } from '@/components/common/EsSearch/types'

import { PLAYER_POSITION_OPTIONS, PLAYER_STATUS_OPTIONS } from './form'

export interface PlayerSearchFieldContext {
  teamOptions: () => SearchOption[]
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
      key: 'teamId',
      label: '代表球队',
      type: 'select',
      placeholder: '全部',
      options: ctx.teamOptions,
      props: {
        filterable: true,
        clearable: true,
      },
    },
    {
      key: 'position',
      label: '位置',
      type: 'select',
      placeholder: '全部',
      options: PLAYER_POSITION_OPTIONS,
      props: {
        filterable: true,
        clearable: true,
      },
    },
  ]
}
