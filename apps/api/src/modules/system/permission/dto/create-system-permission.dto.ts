import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator'

import type { UserStatus } from '@gaoge/shared-types'

export class CreateSystemPermissionDto {
  @IsString()
  @IsNotEmpty()
  code: string

  @IsString()
  @IsNotEmpty()
  name: string

  @IsOptional()
  @IsString()
  description?: string

  @IsIn(['active', 'inactive'])
  status: UserStatus
}
