import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator'

export class CreateSystemResourceDto {
  @IsString()
  @IsNotEmpty()
  key: string

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

  @IsOptional()
  @IsString()
  viewName?: string

  @IsOptional()
  @IsString()
  viewDescription?: string
}
