import { Type } from 'class-transformer'
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator'

import type { UserStatus } from '@gaoge/shared-types'

export class CreateSystemUserDto {
  @IsString()
  @IsNotEmpty()
  account: string

  @IsString()
  @IsNotEmpty()
  password: string

  @IsString()
  @IsNotEmpty()
  nickname: string

  @IsOptional()
  @IsString()
  avatarUrl?: string

  @IsArray()
  @ArrayMinSize(1)
  @Type(() => Number)
  @IsInt({ each: true })
  roleIds: number[]

  @IsIn(['active', 'inactive'])
  status: UserStatus
}
