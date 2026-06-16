import { Type } from 'class-transformer'
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator'

import type { RumorPostStatus } from '@gaoge/shared-types'

const rumorPostStatusValues = ['draft', 'published'] as const

export class RumorPostListDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number

  @IsOptional()
  @IsString()
  keyword?: string

  @IsOptional()
  @IsIn(rumorPostStatusValues)
  status?: RumorPostStatus

  @IsOptional()
  @IsString()
  tag?: string
}
