import dayjs from 'dayjs'

import type { MatchRound } from '@/api/football/match-round'
import type { Team } from '@/api/football/team'

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

export const MATCH_ROUND_VENUE_OPTIONS = [{ label: '腾辉体育中心', value: '腾辉体育中心' }] as const

const DEFAULT_MATCH_ROUND_VENUE = MATCH_ROUND_VENUE_OPTIONS[0].value

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

function getNextTuesdayAfter(matchDate: string | Date) {
  const currentDate = dayjs(matchDate)
  const daysToNextTuesday = (2 - currentDate.day() + 7) % 7 || 7
  return currentDate.add(daysToNextTuesday, 'day').format('YYYY-MM-DD')
}

function getNextRoundValue(round: number) {
  return Math.min(round + 1, MATCH_ROUND_ROUND_OPTIONS.length)
}

export function createEmptyMatchRoundForm(
  teams: Team[] = [],
  previousMatchRound?: Pick<MatchRound, 'year' | 'season' | 'round' | 'matchDate'> | null,
): MatchRoundFormModel {
  return {
    year: previousMatchRound?.year ?? new Date().getFullYear(),
    season: previousMatchRound?.season ?? '',
    round: previousMatchRound ? getNextRoundValue(previousMatchRound.round) : 1,
    collectTeamFee: true,
    matchDate: previousMatchRound ? getNextTuesdayAfter(previousMatchRound.matchDate) : '',
    venue: DEFAULT_MATCH_ROUND_VENUE,
    remark: '',
    results: createMatchRoundResultItems(teams),
  }
}
