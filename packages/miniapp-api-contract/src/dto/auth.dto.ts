export interface MiniProfileSummaryDto {
  userId: string
  nickname?: string
  avatarUrl?: string
  phoneMasked?: string
  phoneBound: boolean
  privacyAccepted: boolean
}

export interface MiniWechatLoginRequestDto {
  code: string
}

export interface MiniWechatLoginResponseDto {
  accessToken: string
  expiresIn: number
  profileSummary: MiniProfileSummaryDto
}

export interface MiniBindPhoneRequestDto {
  code: string
}

export interface MiniPrivacyConsentRequestDto {
  privacyVersion: string
}
