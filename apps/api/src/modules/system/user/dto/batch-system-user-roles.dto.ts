import { Type } from 'class-transformer'
import { ArrayMinSize, IsArray, IsIn, IsInt } from 'class-validator'

import type { SystemUserBatchRoleMode } from '@gaoge/shared-types'

export class BatchSystemUserRolesDto {
  @IsArray()
  @ArrayMinSize(1)
  @Type(() => Number)
  @IsInt({ each: true })
  userIds: number[]

  @IsArray()
  @ArrayMinSize(1)
  @Type(() => Number)
  @IsInt({ each: true })
  roleIds: number[]

  @IsIn(['append', 'replace'])
  mode: SystemUserBatchRoleMode
}
