import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common'

import { Roles } from '@/common/auth/roles.decorator'
import { RolesGuard } from '@/common/auth/roles.guard'

import { ChangePasswordDto } from './dto/change-password.dto'
import { AdminLoginDto, MiniappLoginDto, PhoneLoginDto, RefreshTokenDto } from './dto/login.dto'
import { UpdateProfileDto } from './dto/update-profile.dto'
import { AuthService } from './auth.service'
import { JwtAuthGuard } from './jwt-auth.guard'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  adminLogin(@Body() loginDto: AdminLoginDto) {
    return this.authService.adminLogin(loginDto)
  }

  @Post('miniapp/login')
  @HttpCode(HttpStatus.OK)
  wechatLogin(@Body() loginDto: MiniappLoginDto) {
    return this.authService.wechatLogin(loginDto)
  }

  @Post('phone-login')
  @HttpCode(HttpStatus.OK)
  phoneLogin(@Body() loginDto: PhoneLoginDto) {
    return this.authService.phoneLogin(loginDto)
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  refreshToken(@Body() refreshDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshDto.refreshToken)
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  logout(@Req() request: { user: { id: number } }) {
    return this.authService.logout(request.user.id)
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  @Header('Surrogate-Control', 'no-store')
  profile(@Req() request: { user: { id: number } }) {
    return this.authService.getProfile(request.user.id)
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  updateProfile(
    @Req() request: { user: { id: number } },
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(request.user.id, updateProfileDto)
  }

  @Patch('password')
  @UseGuards(JwtAuthGuard)
  changePassword(
    @Req() request: { user: { id: number } },
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(request.user.id, changePasswordDto)
  }

  @Get('permission')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'viewer')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  @Header('Surrogate-Control', 'no-store')
  permission(@Req() request: { user: { id: number } }) {
    return this.authService.getPermission(request.user.id)
  }
}
