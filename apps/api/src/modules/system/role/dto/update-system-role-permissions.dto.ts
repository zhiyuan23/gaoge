import { Type } from 'class-transformer'
import { ArrayMinSize, IsArray, IsInt, IsString } from 'class-validator'

export class UpdateSystemRolePermissionsDto {
  @IsArray()
  @ArrayMinSize(1)
  @Type(() => Number)
  @IsInt({ each: true })
  permissionIds: number[]

  @IsString()
  expectedUpdatedAt: string
}
