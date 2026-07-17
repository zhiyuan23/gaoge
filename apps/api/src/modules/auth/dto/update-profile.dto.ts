import { IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator'

export class UpdateProfileDto {
  @IsString()
  @MinLength(1)
  @MaxLength(30)
  nickname: string

  @IsOptional()
  @IsString()
  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: true,
  })
  @MaxLength(500)
  avatarUrl?: string | null
}
