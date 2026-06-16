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

import type { RumorPostStatus } from '@gaoge/shared-types'

const rumorPostStatusValues = ['draft', 'published'] as const

export class CreateRumorPostDto {
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
  @IsIn(rumorPostStatusValues)
  status?: RumorPostStatus

  @IsOptional()
  @IsBoolean()
  isPinned?: boolean
}
