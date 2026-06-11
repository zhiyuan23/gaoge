import { Type } from 'class-transformer'
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  ValidateIf,
} from 'class-validator'

import type { MessageBoardPostStatus } from '@gaoge/shared-types'

const messageBoardPostStatusValues = ['draft', 'published'] as const

export class CreateMessageBoardPostDto {
  @IsString()
  @IsNotEmpty()
  title: string

  @IsString()
  @IsNotEmpty()
  content: string

  @IsOptional()
  @IsArray()
  @Type(() => String)
  @IsString({ each: true })
  @ArrayUnique()
  tags?: string[]

  @IsString()
  @IsNotEmpty()
  sourceName: string

  @IsOptional()
  @ValidateIf((_object, value) => typeof value === 'string' && value.trim() !== '')
  @IsUrl({
    require_protocol: true,
  })
  sourceUrl?: string

  @IsOptional()
  @IsIn(messageBoardPostStatusValues)
  status?: MessageBoardPostStatus

  @IsOptional()
  @IsBoolean()
  isPinned?: boolean
}
