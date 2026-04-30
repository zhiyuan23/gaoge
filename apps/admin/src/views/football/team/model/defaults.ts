import type { TeamFormModel, TeamSearch } from './types'

export const TEAM_DEFAULT_SEARCH: TeamSearch = {
  keyword: '',
}

export const TEAM_NAME_OPTIONS = [
  { label: '皇家高歌', value: '皇家高歌' },
  { label: '高歌国际', value: '高歌国际' },
  { label: '高歌联', value: '高歌联' },
] as const

export function createEmptyTeamForm(): TeamFormModel {
  return {
    name: '',
    avatarUrl: '',
    slogan: '',
    sponsorName: '',
    sort: 0,
  }
}
