import { Type } from 'class-transformer'
import { IsDateString, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator'

export class SystemAuditListDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 20

  @IsOptional()
  @IsString()
  @MaxLength(100)
  action?: string

  @IsOptional()
  @IsString()
  @MaxLength(40)
  result?: string

  @IsOptional()
  @IsString()
  @MaxLength(100)
  entityType?: string

  @IsOptional()
  @IsString()
  @MaxLength(100)
  entityId?: string

  @IsOptional()
  @IsString()
  @MaxLength(128)
  requestId?: string

  @IsOptional()
  @IsDateString()
  from?: string

  @IsOptional()
  @IsDateString()
  to?: string
}
