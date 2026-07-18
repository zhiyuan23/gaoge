import type { MiniImageDto } from './common.dto'

export interface MiniReportDto {
  id: string
  title: string
  summary?: string
  cover?: MiniImageDto
  publishedAt: string
}
