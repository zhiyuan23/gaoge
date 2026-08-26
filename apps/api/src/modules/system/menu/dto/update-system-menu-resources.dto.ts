import { Type } from 'class-transformer'
import { IsArray, IsInt, IsString } from 'class-validator'

export class UpdateSystemMenuResourcesDto {
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  resourceIds: number[]

  @IsString()
  expectedUpdatedAt: string
}
