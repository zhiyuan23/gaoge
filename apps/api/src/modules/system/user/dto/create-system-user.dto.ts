import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator'

import type { UserRole, UserStatus } from '@gaoge/shared-types'

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

  @IsIn(['user', 'admin', 'viewer'])
  role: UserRole

  @IsIn(['active', 'inactive'])
  status: UserStatus
}
