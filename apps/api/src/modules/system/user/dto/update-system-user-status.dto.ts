import { IsIn, IsNotEmpty, IsString } from 'class-validator'

import type { UserStatus } from '@gaoge/shared-types'

export class UpdateSystemUserStatusDto {
  @IsNotEmpty()
  @IsIn(['active', 'inactive'])
  status: UserStatus

  @IsString()
  expectedUpdatedAt: string
}
