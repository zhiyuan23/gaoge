import { MINI_API_PREFIX } from './version'

export const MiniRoutes = {
  eventSeriesCurrentHome: `${MINI_API_PREFIX}/event-series/current/home`,
  eventSeriesCurrentSchedules: `${MINI_API_PREFIX}/event-series/current/schedules`,
  scheduleDetail: (scheduleId: string) => `${MINI_API_PREFIX}/schedules/${scheduleId}`,
  eventSeriesCurrentTeams: `${MINI_API_PREFIX}/event-series/current/teams`,
  teamDetail: (teamId: string) => `${MINI_API_PREFIX}/teams/${teamId}`,
  eventSeriesCurrentStandings: `${MINI_API_PREFIX}/event-series/current/standings`,
  reports: `${MINI_API_PREFIX}/reports`,
  reportDetail: (reportId: string) => `${MINI_API_PREFIX}/reports/${reportId}`,
  authWechatLogin: `${MINI_API_PREFIX}/auth/wechat-login`,
  authBindPhone: `${MINI_API_PREFIX}/auth/bind-phone`,
  authProfile: `${MINI_API_PREFIX}/auth/profile`,
  authLogout: `${MINI_API_PREFIX}/auth/logout`,
  authPrivacyConsent: `${MINI_API_PREFIX}/auth/privacy-consent`,
  registrations: `${MINI_API_PREFIX}/registrations`,
  registrationDetail: (registrationId: string) =>
    `${MINI_API_PREFIX}/registrations/${registrationId}`,
  checkInScan: `${MINI_API_PREFIX}/check-ins/scan`,
  clientEvents: `${MINI_API_PREFIX}/client-events`,
} as const

export type MiniRouteKey = keyof typeof MiniRoutes
