import { IsIn, IsOptional, IsString } from 'class-validator'

import type { UserStatus } from '@gaoge/shared-types'

export class SystemResourceListDto {
  @IsOptional()
  @IsString()
  keyword?: string

  @IsOptional()
  @IsString()
  module?: string

  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: UserStatus
}
