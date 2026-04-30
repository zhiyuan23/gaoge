import { Type } from 'class-transformer'
import { IsInt, IsString, Min, ValidateIf } from 'class-validator'

export class CreateTeamDto {
  @IsString()
  name: string

  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsString()
  slogan?: string | null

  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsString()
  sponsorName?: string | null

  @Type(() => Number)
  @IsInt()
  @Min(0)
  sort: number
}
