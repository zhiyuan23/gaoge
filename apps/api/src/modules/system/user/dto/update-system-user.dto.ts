import { Type } from 'class-transformer'
import { ArrayMinSize, IsArray, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class UpdateSystemUserDto {
  @IsString()
  @IsNotEmpty()
  nickname: string

  @IsOptional()
  @IsString()
  avatarUrl?: string

  @IsArray()
  @ArrayMinSize(1)
  @Type(() => Number)
  @IsInt({ each: true })
  roleIds: number[]
}
