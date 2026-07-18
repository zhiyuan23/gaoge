import type { MiniImageDto } from './common.dto'

export interface MiniTeamDto {
  id: string
  name: string
  shortName?: string
  logo?: MiniImageDto
  themeColor?: string
  slogan?: string
}
