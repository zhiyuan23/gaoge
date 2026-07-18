import type { MiniImageDto } from './common.dto'

export interface MiniShareAssetDto {
  title: string
  path: string
  image?: MiniImageDto
}
