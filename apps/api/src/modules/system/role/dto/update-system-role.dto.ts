import { Type } from 'class-transformer'
import { IsArray, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator'

import type { UserStatus } from '@gaoge/shared-types'

export class UpdateSystemRoleDto {
  @IsString()
  @IsNotEmpty()
  name: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: UserStatus

  @IsOptional()
  @IsInt()
  @Min(0)
  sort?: number

  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  permissionIds?: number[]

  @IsString()
  expectedUpdatedAt: string
}
