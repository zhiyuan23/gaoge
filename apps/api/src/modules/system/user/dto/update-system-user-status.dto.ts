import { IsIn, IsNotEmpty } from 'class-validator'

import type { UserStatus } from '@gaoge/shared-types'

export class UpdateSystemUserStatusDto {
  @IsNotEmpty()
  @IsIn(['active', 'inactive'])
  status: UserStatus
}
