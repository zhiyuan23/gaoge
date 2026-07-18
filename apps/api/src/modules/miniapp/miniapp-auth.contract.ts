export const MINI_API_VERSION = 'mini-v1'

export interface MiniApiMeta {
  requestId: string
  serverTime: string
  apiVersion: typeof MINI_API_VERSION
}

export interface MiniApiSuccess<T> {
  success: true
  data: T
  meta: MiniApiMeta
}

export interface MiniProfileSummaryDto {
  userId: string
  nickname?: string
  avatarUrl?: string
  phoneMasked?: string
  phoneBound: boolean
  privacyAccepted: boolean
}

export interface MiniWechatLoginResponseDto {
  accessToken: string
  expiresIn: number
  profileSummary: MiniProfileSummaryDto
}
