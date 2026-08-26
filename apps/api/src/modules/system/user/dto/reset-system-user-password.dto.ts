import { IsNotEmpty, IsString } from 'class-validator'

export class ResetSystemUserPasswordDto {
  @IsString()
  @IsNotEmpty()
  newPassword: string

  @IsString()
  expectedUpdatedAt: string
}
