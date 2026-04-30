import type { Team } from '@/api/teams'

import type { MatchRoundFormModel, MatchRoundResultFormItem, MatchRoundSearch } from './types'

export const MATCH_ROUND_DEFAULT_SEARCH: MatchRoundSearch = {
  matchDate: '',
  venueKeyword: '',
}

export function getPointsByRank(rank: 1 | 2 | 3 | null): 0 | 1 | 2 | null {
  if (rank === 1) {
    return 2
  }

  if (rank === 2) {
    return 1
  }

  if (rank === 3) {
    return 0
  }

  return null
}

export function createMatchRoundResultItems(teams: Team[]): MatchRoundResultFormItem[] {
  return teams.map((team) => ({
    teamId: team.id,
    teamName: team.name,
    rank: null,
    points: null,
  }))
}

export function createEmptyMatchRoundForm(teams: Team[] = []): MatchRoundFormModel {
  return {
    matchDate: '',
    venue: '',
    remark: '',
    results: createMatchRoundResultItems(teams),
  }
}
