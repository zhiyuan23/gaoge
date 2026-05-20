import { Type } from 'class-transformer'
import { IsArray, IsInt } from 'class-validator'

export class UpdateSystemMenuPermissionsDto {
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  permissionIds: number[]
}
