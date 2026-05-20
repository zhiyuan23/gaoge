import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator'

import type { UserStatus } from '@gaoge/shared-types'

export class UpdateSystemRoleDto {
  @IsString()
  @IsNotEmpty()
  name: string

  @IsOptional()
  @IsString()
  description?: string

  @IsIn(['active', 'inactive'])
  status: UserStatus

  @IsOptional()
  @IsInt()
  @Min(0)
  sort?: number
}
