import { Type } from 'class-transformer'
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator'

import type { MessageBoardPostStatus } from '@gaoge/shared-types'

const messageBoardPostStatusValues = ['draft', 'published'] as const

export class MessageBoardPostListDto {
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
  @IsIn(messageBoardPostStatusValues)
  status?: MessageBoardPostStatus

  @IsOptional()
  @IsString()
  tag?: string
}
