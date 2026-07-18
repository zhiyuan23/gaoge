import type { MiniImageDto, MiniThemeDto } from './common.dto'

export interface MiniEventSeriesDto {
  id: string
  code: string
  name: string
  subtitle?: string
  logo?: MiniImageDto
  cover?: MiniImageDto
  theme?: MiniThemeDto
  status: 'preparing' | 'active' | 'finished' | 'archived'
}
