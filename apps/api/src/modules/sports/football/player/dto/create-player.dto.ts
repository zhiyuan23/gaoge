import { Type } from 'class-transformer'
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDate,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator'

import type { FootballPosition, PlayerStatus } from '@gaoge/shared-types'

const footballPositionValues: FootballPosition[] = [
  'goalkeeper',
  'center_back',
  'left_back',
  'right_back',
  'defensive_midfielder',
  'central_midfielder',
  'attacking_midfielder',
  'left_winger',
  'right_winger',
  'striker',
  'forward',
]

export class CreatePlayerDto {
  @IsOptional()
  @IsString()
  openid?: string

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  playerNumber: number

  @IsString()
  nickname: string

  @IsOptional()
  @IsString()
  realName?: string

  @IsOptional()
  @IsString()
  avatarUrl?: string

  @IsOptional()
  @IsString()
  subTeam?: string // real/inter/united，多选用逗号分隔

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @Type(() => Number)
  @IsInt({ each: true })
  teamIds?: number[]

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  primaryTeamId?: number | null

  @IsOptional()
  @IsString()
  jerseyName?: string

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  birthDate?: Date

  @IsOptional()
  @IsBoolean()
  isAdmin?: boolean

  @IsOptional()
  @IsString()
  position?: string

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsIn(footballPositionValues, { each: true })
  positions?: FootballPosition[]

  @IsOptional()
  @IsIn(footballPositionValues)
  primaryPosition?: FootballPosition | null

  @IsOptional()
  @IsString()
  jerseySize?: string

  @IsOptional()
  @IsString()
  status?: PlayerStatus

  @IsOptional()
  @IsString()
  @MaxLength(15)
  signature?: string

  @IsOptional()
  @IsString()
  remark?: string
}
