import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator'

export class UpdateSystemResourceDto {
  @IsString()
  @IsNotEmpty()
  name: string

  @IsString()
  @IsNotEmpty()
  module: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsInt()
  @Min(0)
  sort?: number

  @IsString()
  expectedUpdatedAt: string
}
