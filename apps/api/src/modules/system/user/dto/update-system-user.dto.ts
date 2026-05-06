import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator'

import type { UserRole } from '@gaoge/shared-types'

export class UpdateSystemUserDto {
  @IsString()
  @IsNotEmpty()
  nickname: string

  @IsOptional()
  @IsString()
  avatarUrl?: string

  @IsIn(['user', 'admin', 'viewer'])
  role: UserRole
}
