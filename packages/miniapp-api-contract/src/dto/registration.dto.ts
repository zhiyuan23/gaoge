export interface MiniRegistrationDto {
  id: string
  scheduleId: string
  status: 'submitted' | 'confirmed' | 'cancelled' | 'waitlisted'
  submittedAt: string
}

export interface MiniCreateRegistrationRequestDto {
  scheduleId: string
  requestId: string
}
