export const MINI_API_VERSION = 'mini-v1' as const

export const MINI_API_PREFIX = '/mini/v1' as const

export const MiniErrorCode = {
  Unauthorized: 'UNAUTHORIZED',
  PhoneRequired: 'PHONE_REQUIRED',
  Forbidden: 'FORBIDDEN',
  EventSeriesNotFound: 'EVENT_SERIES_NOT_FOUND',
  ScheduleNotFound: 'SCHEDULE_NOT_FOUND',
  RegistrationClosed: 'REGISTRATION_CLOSED',
  RegistrationFull: 'REGISTRATION_FULL',
  AlreadyRegistered: 'ALREADY_REGISTERED',
  RegistrationNotFound: 'REGISTRATION_NOT_FOUND',
  RegistrationCancelClosed: 'REGISTRATION_CANCEL_CLOSED',
  CheckInNotOpen: 'CHECK_IN_NOT_OPEN',
  CheckInQrInvalid: 'CHECK_IN_QR_INVALID',
  CheckInExpired: 'CHECK_IN_EXPIRED',
  AlreadyCheckedIn: 'ALREADY_CHECKED_IN',
  RegistrationRequired: 'REGISTRATION_REQUIRED',
  RateLimited: 'RATE_LIMITED',
  InternalError: 'INTERNAL_ERROR',
  NetworkUnstable: 'NETWORK_UNSTABLE',
} as const

export type MiniErrorCode = (typeof MiniErrorCode)[keyof typeof MiniErrorCode]

export type MiniApiResult<T> = MiniApiSuccess<T> | MiniApiFailure

export interface MiniApiSuccess<T> {
  success: true
  data: T
  meta: MiniApiMeta
}

export interface MiniApiFailure {
  success: false
  error: MiniApiError
  meta: MiniApiMeta
}

export interface MiniApiMeta {
  requestId: string
  serverTime: string
  apiVersion: typeof MINI_API_VERSION
}

export interface MiniApiError {
  code: MiniErrorCode
  message: string
  traceId?: string
}

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
