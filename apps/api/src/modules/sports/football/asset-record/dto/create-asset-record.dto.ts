import { Type } from 'class-transformer'
import {
  IsBoolean,
  IsDate,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator'

import type { AssetRecordDirection, AssetRecordStatus, AssetRecordType } from '@gaoge/shared-types'

const ASSET_RECORD_DIRECTIONS = ['income', 'expense'] as const
const ASSET_RECORD_TYPES = [
  'match_fee',
  'extra_income',
  'equipment',
  'activity',
  'other_expense',
] as const
const ASSET_RECORD_STATUSES = ['confirmed', 'cancelled'] as const

export class CreateAssetRecordDto {
  @IsIn(ASSET_RECORD_DIRECTIONS)
  direction: AssetRecordDirection

  @IsIn(ASSET_RECORD_TYPES)
  recordType: AssetRecordType

  @Type(() => Number)
  @IsInt()
  @Min(0)
  amount: number

  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsString()
  seasonLabel?: string | null

  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsString()
  matchLabel?: string | null

  @IsOptional()
  @IsBoolean()
  isWaived?: boolean

  @IsString()
  title: string

  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsString()
  description?: string | null

  @Type(() => Date)
  @IsDate()
  recordDate: Date

  @IsOptional()
  @IsIn(ASSET_RECORD_STATUSES)
  status?: AssetRecordStatus
}
