import { Type } from 'class-transformer'
import { IsArray, IsInt } from 'class-validator'

export class UpdateSystemRoleMenuAccessDto {
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  menuIds: number[]
}
