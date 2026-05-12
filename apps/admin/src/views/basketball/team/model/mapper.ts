import type { Team, TeamListParams, TeamPayload } from '@/api/basketball/team'

import type { TeamFormModel, TeamSearch } from './types'

export function createTeamFormFromRow(row: Team): TeamFormModel {
  return {
    id: row.id,
    name: row.name,
    avatarUrl: row.avatarUrl ?? '',
    slogan: row.slogan ?? '',
    sponsorName: row.sponsorName ?? '',
    sort: row.sort,
  }
}

function normalizeOptionalText(value: string) {
  const trimmed = value.trim()
  return trimmed || null
}

export function buildTeamPayload(model: TeamFormModel): TeamPayload {
  return {
    name: model.name.trim(),
    avatarUrl: normalizeOptionalText(model.avatarUrl),
    slogan: normalizeOptionalText(model.slogan),
    sponsorName: normalizeOptionalText(model.sponsorName),
    sort: Number(model.sort),
  }
}

export function buildTeamListParams(
  search: TeamSearch,
  page: number,
  pageSize: number,
): TeamListParams {
  return {
    page,
    pageSize,
    keyword: search.keyword || undefined,
  }
}
