import type {
  FootballStandingParams,
  FootballStandingResponse,
  FootballStandingRound,
  FootballStandingTeam,
} from '@gaoge/shared-types'

const standingParams = {
  year: 2026,
  season: '春季赛',
} satisfies FootballStandingParams

const standingRound = {
  id: 1,
  round: 1,
  matchDate: '2026-04-28T20:00:00.000Z',
  label: '第 1 轮',
} satisfies FootballStandingRound

const standingTeam = {
  teamId: 1,
  teamCode: 'real',
  teamName: '皇家高歌',
  totalPoints: 6,
  roundPoints: [2, 2, 2],
} satisfies FootballStandingTeam

const standingResponse = {
  season: {
    year: standingParams.year,
    season: standingParams.season,
  },
  rounds: [standingRound],
  teams: [standingTeam],
} satisfies FootballStandingResponse

const seasonName: '春季赛' | '夏季赛' | '秋季赛' | '冬季赛' = standingResponse.season.season
const roundLabel: string = standingResponse.rounds[0].label
const roundDate: string = standingResponse.rounds[0].matchDate
const teamCode: 'real' | 'inter' | 'united' = standingResponse.teams[0].teamCode
const roundPoints: number[] = standingResponse.teams[0].roundPoints

export const standingSharedTypesCompileCheck = {
  roundDate,
  roundLabel,
  roundPoints,
  seasonName,
  teamCode,
}
