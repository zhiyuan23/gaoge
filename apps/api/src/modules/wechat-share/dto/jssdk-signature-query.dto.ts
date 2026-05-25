import { IsNotEmpty, IsString, IsUrl } from 'class-validator'

export class JssdkSignatureQueryDto {
  @IsString()
  @IsNotEmpty()
  @IsUrl({
    require_tld: false,
  })
  url!: string
}
