import { IsIn, IsNotEmpty } from 'class-validator'

import type { UserStatus } from '@gaoge/shared-types'

export class UpdateSystemRoleStatusDto {
  @IsNotEmpty()
  @IsIn(['active', 'inactive'])
  status: UserStatus
}
