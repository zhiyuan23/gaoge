import { Type } from 'class-transformer'
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDate,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
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
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year: number

  @IsIn(['春季赛', '夏季赛', '秋季赛', '冬季赛'])
  season: '春季赛' | '夏季赛' | '秋季赛' | '冬季赛'

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(15)
  round: number

  @IsOptional()
  @IsBoolean()
  collectTeamFee?: boolean

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
