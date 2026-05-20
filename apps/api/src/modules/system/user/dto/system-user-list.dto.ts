import { Type } from 'class-transformer'
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator'

import type { SystemUserListParams, UserStatus } from '@gaoge/shared-types'

export class SystemUserListDto implements SystemUserListParams {
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
  @Type(() => Number)
  @IsInt()
  @Min(1)
  roleId?: number

  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: UserStatus
}
