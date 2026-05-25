import { IsNotEmpty, IsString } from 'class-validator'

export class GetWechatSharePublicConfigDto {
  @IsString()
  @IsNotEmpty()
  path!: string
}
