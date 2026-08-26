import { IsIn, IsString } from 'class-validator'

import type { UserStatus } from '@gaoge/shared-types'

export class UpdateSystemResourceStatusDto {
  @IsIn(['active', 'inactive'])
  status: UserStatus

  @IsString()
  expectedUpdatedAt: string
}
