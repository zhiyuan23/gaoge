import { IsNotEmpty, IsOptional, IsString, IsUrl, ValidateIf } from 'class-validator'

const HTTPS_URL_RULE = {
  protocols: ['https'],
  require_protocol: true,
  require_tld: false,
}

export class UpdateWechatShareAdminConfigDto {
  @IsString()
  @IsNotEmpty()
  appId!: string

  @IsOptional()
  @IsString()
  appSecret?: string

  @IsString()
  @IsNotEmpty()
  @IsUrl(HTTPS_URL_RULE)
  defaultImageUrl!: string

  @IsString()
  @IsNotEmpty()
  homeTitle!: string

  @IsString()
  @IsNotEmpty()
  homeDesc!: string

  @ValidateIf((_, value) => value !== undefined && value !== null && value !== '')
  @IsUrl(HTTPS_URL_RULE)
  homeImageUrl?: string

  @IsString()
  @IsNotEmpty()
  teamsTitle!: string

  @IsString()
  @IsNotEmpty()
  teamsDesc!: string

  @ValidateIf((_, value) => value !== undefined && value !== null && value !== '')
  @IsUrl(HTTPS_URL_RULE)
  teamsImageUrl?: string

  @IsString()
  @IsNotEmpty()
  assetsTitle!: string

  @IsString()
  @IsNotEmpty()
  assetsDesc!: string

  @ValidateIf((_, value) => value !== undefined && value !== null && value !== '')
  @IsUrl(HTTPS_URL_RULE)
  assetsImageUrl?: string
}
