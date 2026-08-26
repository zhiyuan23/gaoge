import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator'

import type { UserStatus } from '@gaoge/shared-types'

export class CreateSystemResourcePermissionDto {
  @IsString()
  @IsNotEmpty()
  action: string

  @IsString()
  @IsNotEmpty()
  name: string

  @IsOptional()
  @IsString()
  description?: string

  @IsIn(['active', 'inactive'])
  status: UserStatus
}
