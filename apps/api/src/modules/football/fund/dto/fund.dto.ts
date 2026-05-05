import { Type } from 'class-transformer'
import { IsDate, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator'

import type { TeamFundCategory, TeamFundStatus, TeamFundType } from '@gaoge/shared-types'

export class CreateFundDto {
  @IsIn(['income', 'expense'])
  type: TeamFundType

  @IsInt()
  @Min(1)
  amount: number

  @IsString()
  title: string

  @IsOptional()
  @IsString()
  description?: string

  @IsString()
  category: TeamFundCategory

  @IsOptional()
  @IsIn(['pending', 'confirmed', 'cancelled'])
  status?: TeamFundStatus

  @Type(() => Date)
  @IsDate()
  recordDate: Date
}

export class QueryFundDto {
  @IsOptional()
  @IsIn(['income', 'expense'])
  type?: TeamFundType

  @IsOptional()
  @IsString()
  category?: TeamFundCategory

  @IsOptional()
  @IsIn(['pending', 'confirmed', 'cancelled'])
  status?: TeamFundStatus

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date
}

export class UpdateFundDto {
  @IsOptional()
  @IsIn(['income', 'expense'])
  type?: TeamFundType

  @IsOptional()
  @IsInt()
  @Min(1)
  amount?: number

  @IsOptional()
  @IsString()
  title?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsString()
  category?: TeamFundCategory

  @IsOptional()
  @IsIn(['pending', 'confirmed', 'cancelled'])
  status?: TeamFundStatus

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  recordDate?: Date
}
