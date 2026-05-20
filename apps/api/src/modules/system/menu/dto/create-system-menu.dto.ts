import { Type } from 'class-transformer'
import { IsBoolean, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator'

import type { SystemMenuType, UserStatus } from '@gaoge/shared-types'

export class CreateSystemMenuDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  parentId?: number | null

  @IsString()
  @IsNotEmpty()
  name: string

  @IsString()
  @IsNotEmpty()
  title: string

  @IsOptional()
  @IsString()
  icon?: string

  @IsString()
  @IsNotEmpty()
  path: string

  @IsString()
  @IsNotEmpty()
  routeName: string

  @IsIn(['catalog', 'menu'])
  menuType: SystemMenuType

  @IsOptional()
  @IsInt()
  @Min(0)
  sort?: number

  @IsIn(['active', 'inactive'])
  status: UserStatus

  @IsBoolean()
  visible: boolean
}
