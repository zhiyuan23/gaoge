import type { SearchField, SearchOption } from '@/components/common/EsSearch/types'

import { getPlayerStatusLabel, PLAYER_STATUS_OPTIONS } from './form'

export interface PlayerSearchFieldContext {
  subTeamOptions: () => SearchOption[]
  positionOptions: () => SearchOption[]
  statusOptions: () => SearchOption[]
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
      placeholder: '昵称 / 姓名 / OpenID / 位置',
    },
    {
      key: 'subTeam',
      label: '分队',
      type: 'select',
      placeholder: '全部',
      options: ctx.subTeamOptions,
      props: {
        filterable: true,
      },
    },
    {
      key: 'position',
      label: '位置',
      type: 'select',
      placeholder: '全部',
      options: ctx.positionOptions,
      props: {
        filterable: true,
      },
    },
    {
      key: 'status',
      label: '状态',
      type: 'select',
      placeholder: '全部',
      options: () =>
        ctx.statusOptions().map((item) => ({
          ...item,
          label: getPlayerStatusLabel(String(item.value)),
        })),
      props: {
        filterable: true,
      },
    },
  ]
}
