import type { MiniImageDto } from './common.dto'

export interface MiniParticipantDto {
  id: string
  displayName: string
  avatar?: MiniImageDto
  jerseyNumber?: number
  teamId?: string
  role?: 'player' | 'coach' | 'guest'
}
