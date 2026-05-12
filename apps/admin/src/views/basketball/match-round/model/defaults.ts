import type { Team } from '@/api/basketball/team'

import type { MatchRoundFormModel, MatchRoundResultFormItem, MatchRoundSearch } from './types'

export const MATCH_ROUND_DEFAULT_SEARCH: MatchRoundSearch = {
  year: '',
  season: '',
  round: '',
  matchDate: '',
  venueKeyword: '',
}

export const MATCH_ROUND_YEAR_OPTIONS = Array.from({ length: 11 }, (_, index) => {
  const year = new Date().getFullYear() - 5 + index
  return {
    label: `${year}年`,
    value: year,
  }
})

export const MATCH_ROUND_SEASON_OPTIONS = [
  { label: '春季赛', value: '春季赛' },
  { label: '夏季赛', value: '夏季赛' },
  { label: '秋季赛', value: '秋季赛' },
  { label: '冬季赛', value: '冬季赛' },
] as const

export const MATCH_ROUND_ROUND_OPTIONS = Array.from({ length: 15 }, (_, index) => ({
  label: `第${index + 1}轮`,
  value: index + 1,
}))

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
    year: new Date().getFullYear(),
    season: '',
    round: 1,
    matchDate: '',
    venue: '',
    remark: '',
    results: createMatchRoundResultItems(teams),
  }
}
