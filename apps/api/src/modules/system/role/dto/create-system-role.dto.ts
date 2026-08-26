import { Type } from 'class-transformer'
import { IsArray, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator'

import type { UserStatus } from '@gaoge/shared-types'

export class CreateSystemRoleDto {
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

  @IsOptional()
  @IsInt()
  @Min(0)
  sort?: number

  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  permissionIds?: number[]
}
