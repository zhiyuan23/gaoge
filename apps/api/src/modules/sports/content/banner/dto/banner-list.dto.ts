import { IsIn, IsOptional, IsString } from 'class-validator'

import type { BannerJumpType, BannerStatus } from '@gaoge/shared-types'

const bannerStatusValues = ['active', 'inactive'] as const
const bannerJumpTypeValues = ['none', 'webview', 'miniapp'] as const

export class BannerListDto {
  @IsOptional()
  @IsString()
  keyword?: string

  @IsOptional()
  @IsIn(bannerStatusValues)
  status?: BannerStatus

  @IsOptional()
  @IsIn(bannerJumpTypeValues)
  jumpType?: BannerJumpType
}
