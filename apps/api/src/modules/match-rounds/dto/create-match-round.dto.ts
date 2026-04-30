import { Type } from 'class-transformer'
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDate,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'

export class MatchRoundResultDto {
  @Type(() => Number)
  @IsInt()
  teamId: number

  @Type(() => Number)
  @IsInt()
  rank: number
}

export class CreateMatchRoundDto {
  @Type(() => Date)
  @IsDate()
  matchDate: Date

  @IsOptional()
  @IsString()
  venue?: string | null

  @IsOptional()
  @IsString()
  remark?: string | null

  @IsArray()
  @ArrayMinSize(3)
  @ArrayMaxSize(3)
  @ValidateNested({ each: true })
  @Type(() => MatchRoundResultDto)
  results: MatchRoundResultDto[]
}
