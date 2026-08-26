import { Type } from 'class-transformer'
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator'

import type { SystemMenuType, UserStatus } from '@gaoge/shared-types'

export class UpdateSystemMenuDto {
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

  @IsOptional()
  @IsString()
  path: string | null

  @IsString()
  @IsNotEmpty()
  routeName: string

  @IsIn(['group', 'catalog', 'menu'])
  menuType: SystemMenuType

  @IsOptional()
  @IsInt()
  @Min(0)
  sort?: number

  @IsIn(['active', 'inactive'])
  status: UserStatus

  @IsBoolean()
  visible: boolean

  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  resourceIds?: number[]

  @IsString()
  expectedUpdatedAt: string
}
