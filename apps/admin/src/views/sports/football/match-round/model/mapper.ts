import dayjs from 'dayjs'

import type {
  MatchRound,
  MatchRoundListParams,
  MatchRoundPayload,
  UpdateMatchRoundPayload,
} from '@/api/football/match-round'
import type { Team } from '@/api/football/team'

import { createMatchRoundResultItems, getPointsByRank } from './defaults'
import type { MatchRoundFormModel, MatchRoundSearch } from './types'

export function createMatchRoundFormFromRow(row: MatchRound, teams: Team[]): MatchRoundFormModel {
  const fallbackResults = createMatchRoundResultItems(teams)
  const canMapToCurrentTeams =
    teams.length === row.results.length &&
    row.results.every((item) => teams.some((team) => team.id === item.teamId))

  const results =
    teams.length > 0 && canMapToCurrentTeams
      ? teams.map((team) => {
          const current = row.results.find((item) => item.teamId === team.id)

          return {
            teamId: team.id,
            teamName: team.name,
            rank: current?.rank ?? null,
            points: current?.points ?? getPointsByRank(current?.rank ?? null),
          }
        })
      : row.results.map((item) => ({
          teamId: item.teamId,
          teamName: item.teamName ?? `球队 ${item.teamId}`,
          rank: item.rank,
          points: item.points,
        }))

  return {
    id: row.id,
    year: row.year,
    season: row.season,
    round: row.round,
    collectTeamFee: row.collectTeamFee ?? true,
    matchDate: dayjs(row.matchDate).format('YYYY-MM-DD'),
    venue: row.venue ?? '',
    remark: row.remark ?? '',
    results: results.length > 0 ? results : fallbackResults,
  }
}

function normalizeOptionalText(value: string) {
  const trimmed = value.trim()
  return trimmed || null
}

function getYearFromMatchDate(matchDate: string) {
  return dayjs(matchDate).year()
}

function buildResultsPayload(model: MatchRoundFormModel): MatchRoundPayload['results'] {
  return model.results.map((item) => ({
    teamId: item.teamId,
    rank: item.rank as 1 | 2 | 3,
  })) as MatchRoundPayload['results']
}

export function buildMatchRoundPayload(model: MatchRoundFormModel): MatchRoundPayload {
  return {
    year: getYearFromMatchDate(model.matchDate),
    season: model.season as MatchRoundPayload['season'],
    round: Number(model.round),
    collectTeamFee: model.collectTeamFee,
    matchDate: model.matchDate,
    venue: normalizeOptionalText(model.venue),
    remark: normalizeOptionalText(model.remark),
    results: buildResultsPayload(model),
  }
}

export function buildMatchRoundUpdatePayload(model: MatchRoundFormModel): UpdateMatchRoundPayload {
  return buildMatchRoundPayload(model)
}

export function buildMatchRoundListParams(
  search: MatchRoundSearch,
  page: number,
  pageSize: number,
): MatchRoundListParams {
  return {
    page,
    pageSize,
    year: search.year || undefined,
    season: search.season || undefined,
    round: search.round || undefined,
    matchDate: search.matchDate || undefined,
    venueKeyword: search.venueKeyword.trim() || undefined,
  }
}
