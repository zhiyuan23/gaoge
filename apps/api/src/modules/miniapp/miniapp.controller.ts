import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common'

import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard'

import { BindFootballPlayerDto } from './dto/bind-football-player.dto'
import { MiniappService } from './miniapp.service'

@Controller('miniapp')
@UseGuards(JwtAuthGuard)
export class MiniappController {
  constructor(private readonly miniappService: MiniappService) {}

  @Get('me')
  getMe(@Req() request: { user: { id: number } }) {
    return this.miniappService.getMe(request.user.id)
  }

  @Get('football-player/bind-options')
  listBindOptions() {
    return this.miniappService.listBindOptions()
  }

  @Post('football-player/bind')
  bindFootballPlayer(@Req() request: { user: { id: number } }, @Body() dto: BindFootballPlayerDto) {
    return this.miniappService.bindFootballPlayer(request.user.id, dto.playerNumber)
  }
}
