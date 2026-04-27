import type { SearchField, SearchOption } from '@/components/common/EsSearch/types'

import { getPlayerStatusLabel } from '../formatters'
import type { PlayerSearch } from '../model/types'

export interface PlayerSearchFieldContext {
  subTeamOptions: () => SearchOption[]
  positionOptions: () => SearchOption[]
  statusOptions: () => SearchOption[]
}

export const PLAYER_DEFAULT_SEARCH: PlayerSearch = {
  keyword: '',
  subTeam: '',
  position: '',
  status: '',
}

export function createPlayerSearchFields(ctx: PlayerSearchFieldContext): SearchField[] {
  return [
    {
      key: 'keyword',
      label: '关键词',
      type: 'input',
      placeholder: '昵称 / 姓名 / OpenID / 位置',
      span: 8,
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
