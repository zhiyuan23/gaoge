import { Type } from 'class-transformer'
import { IsArray, IsInt, IsString } from 'class-validator'

export class UpdateSystemMenuPermissionsDto {
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  permissionIds: number[]

  @IsString()
  expectedUpdatedAt: string
}
