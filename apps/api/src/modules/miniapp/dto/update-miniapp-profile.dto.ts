import { Type } from 'class-transformer'
import { IsDate, IsOptional, IsString, MaxLength } from 'class-validator'

export class UpdateMiniappProfileDto {
  @IsOptional()
  @IsString()
  nickname?: string

  @IsOptional()
  @IsString()
  realName?: string | null

  @IsOptional()
  @IsString()
  subTeam?: string | null

  @IsOptional()
  @IsString()
  jerseyName?: string | null

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  birthDate?: Date | null

  @IsOptional()
  @IsString()
  position?: string | null

  @IsOptional()
  @IsString()
  jerseySize?: string | null

  @IsOptional()
  @IsString()
  @MaxLength(15)
  signature?: string | null

  @IsOptional()
  @IsString()
  remark?: string | null
}
