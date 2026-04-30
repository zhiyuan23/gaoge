import type { TeamFormModel, TeamSearch } from './types'

export const TEAM_DEFAULT_SEARCH: TeamSearch = {
  keyword: '',
}

export function createEmptyTeamForm(): TeamFormModel {
  return {
    name: '',
    slogan: '',
    sponsorName: '',
    sort: 0,
  }
}
