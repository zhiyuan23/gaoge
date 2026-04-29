import { Type } from 'class-transformer'
import { IsBoolean, IsDate, IsInt, IsOptional, IsString, Max, Min } from 'class-validator'

import type { PlayerStatus } from '@gaoge/shared-types'

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
  @IsString()
  jerseySize?: string

  @IsOptional()
  @IsString()
  status?: PlayerStatus

  @IsOptional()
  @IsString()
  remark?: string
}
