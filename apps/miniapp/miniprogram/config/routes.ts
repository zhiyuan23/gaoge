export const Routes = {
  home: '/pages/home/index',
  schedule: '/pages/schedule/index',
  teams: '/pages/teams/index',
  standings: '/pages/standings/index',
  profile: '/pages/profile/index',
  launch: '/pages/launch/index',
  matchDetail: '/packages/match/pages/match-detail/index',
  registration: '/packages/match/pages/registration/index',
  checkIn: '/packages/match/pages/check-in/index',
  reports: '/packages/content/pages/reports/index',
  reportDetail: '/packages/content/pages/report-detail/index',
  teamDetail: '/packages/player/pages/team-detail/index',
  playerDetail: '/packages/player/pages/player-detail/index',
  sharePoster: '/packages/poster/pages/share-poster/index',
} as const

export type RouteKey = keyof typeof Routes
