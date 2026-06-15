import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator'

import type { BannerJumpType, BannerStatus } from '@gaoge/shared-types'

const bannerStatusValues = ['active', 'inactive'] as const
const bannerJumpTypeValues = ['none', 'webview', 'miniapp'] as const

export class CreateBannerDto {
  @IsString()
  @IsNotEmpty()
  title: string

  @IsString()
  @IsNotEmpty()
  imageUrl: string

  @IsOptional()
  @IsIn(bannerJumpTypeValues)
  jumpType?: BannerJumpType

  @IsOptional()
  @IsString()
  jumpUrl?: string

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(999)
  sort?: number

  @IsOptional()
  @IsIn(bannerStatusValues)
  status?: BannerStatus
}
