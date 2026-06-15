import { Type } from 'class-transformer'
import { IsDate, IsIn, IsOptional, IsString } from 'class-validator'

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

export class AssetRecordListDto {
  @IsOptional()
  @IsString()
  page?: string | number

  @IsOptional()
  @IsString()
  pageSize?: string | number

  @IsOptional()
  @IsString()
  keyword?: string

  @IsOptional()
  @IsIn(ASSET_RECORD_DIRECTIONS)
  direction?: AssetRecordDirection

  @IsOptional()
  @IsIn(ASSET_RECORD_TYPES)
  recordType?: AssetRecordType

  @IsOptional()
  @IsString()
  seasonLabel?: string

  @IsOptional()
  @IsIn(ASSET_RECORD_STATUSES)
  status?: AssetRecordStatus

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date
}
