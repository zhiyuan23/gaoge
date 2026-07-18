export interface MiniScheduleTeamDto {
  teamId: string
  name: string
  logoUrl?: string
  score?: number
}

export interface MiniScheduleDto {
  id: string
  title: string
  roundName?: string
  startTime: string
  venueName?: string
  status: 'scheduled' | 'live' | 'finished' | 'cancelled'
  homeTeam?: MiniScheduleTeamDto
  awayTeam?: MiniScheduleTeamDto
}
