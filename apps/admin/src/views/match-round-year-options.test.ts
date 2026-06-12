import assert from 'node:assert/strict'

import { buildMatchRoundYearFilterOptions as buildBasketballYearFilterOptions } from './basketball/match-round/model/defaults'
import { buildMatchRoundPayload as buildBasketballMatchRoundPayload } from './basketball/match-round/model/mapper'
import { buildMatchRoundYearFilterOptions as buildFootballYearFilterOptions } from './football/match-round/model/defaults'
import { buildMatchRoundPayload as buildFootballMatchRoundPayload } from './football/match-round/model/mapper'

function runYearFilterOptionAssertions(
  buildYearFilterOptions: (years: Array<number | null | undefined>) => Array<{
    label: string
    value: number
  }>,
) {
  assert.deepEqual(buildYearFilterOptions([]), [])
  assert.deepEqual(buildYearFilterOptions([2025, 2026, 2025, null, undefined, 2024]), [
    { label: '2026年', value: 2026 },
    { label: '2025年', value: 2025 },
    { label: '2024年', value: 2024 },
  ])
}

runYearFilterOptionAssertions(buildFootballYearFilterOptions)
runYearFilterOptionAssertions(buildBasketballYearFilterOptions)

assert.equal(
  buildFootballMatchRoundPayload({
    year: 2025,
    season: '春季赛',
    round: 1,
    collectTeamFee: true,
    matchDate: '2026-03-18',
    venue: '腾辉体育中心',
    remark: 'test',
    results: [
      { teamId: 1, teamName: 'A', rank: 1, points: 2 },
      { teamId: 2, teamName: 'B', rank: 2, points: 1 },
      { teamId: 3, teamName: 'C', rank: 3, points: 0 },
    ],
  }).year,
  2026,
)

assert.equal(
  buildBasketballMatchRoundPayload({
    year: 2025,
    season: '春季赛',
    round: 1,
    matchDate: '2026-03-18',
    venue: '腾辉体育中心',
    remark: 'test',
    results: [
      { teamId: 1, teamName: 'A', rank: 1, points: 2 },
      { teamId: 2, teamName: 'B', rank: 2, points: 1 },
      { teamId: 3, teamName: 'C', rank: 3, points: 0 },
    ],
  }).year,
  2026,
)
