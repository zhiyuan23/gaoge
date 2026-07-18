export interface MiniCheckInDto {
  id: string
  scheduleId: string
  status: 'checked_in' | 'already_checked_in'
  checkedInAt: string
}

export interface MiniCheckInScanRequestDto {
  token: string
  requestId: string
}
