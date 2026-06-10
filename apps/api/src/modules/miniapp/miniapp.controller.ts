import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { extname, join } from 'node:path'
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import type { Request } from 'express'

import {
  miniappAvatarPublicPrefix,
  resolveMiniappAvatarUploadDir,
} from '@/common/storage/upload-path'
import { JwtAuthGuard } from '@/modules/auth/jwt-auth.guard'

import { BindFootballPlayerDto } from './dto/bind-football-player.dto'
import { UpdateMiniappProfileDto } from './dto/update-miniapp-profile.dto'
import { MiniappService } from './miniapp.service'

type MiniappUploadedFile = {
  buffer: Buffer
  mimetype: string
  originalname: string
}

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

  @Post('me/profile')
  updateProfile(@Req() request: { user: { id: number } }, @Body() dto: UpdateMiniappProfileDto) {
    return this.miniappService.updateProfile(request.user.id, dto)
  }

  @Post('me/avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  async uploadAvatar(
    @Req() request: Request & { user: { id: number } },
    @UploadedFile() file?: MiniappUploadedFile,
  ) {
    const avatarUrl = await saveMiniappAvatar(request, file)

    return this.miniappService.updateProfile(request.user.id, { avatarUrl })
  }
}

async function saveMiniappAvatar(request: Request, file?: MiniappUploadedFile) {
  if (!file?.buffer?.length) {
    throw new BadRequestException('请上传头像文件')
  }

  if (!file.mimetype?.startsWith('image/')) {
    throw new BadRequestException('头像文件格式不正确')
  }

  const host = request.get('host')

  if (!host) {
    throw new BadRequestException('无法识别上传地址')
  }

  const protocol = resolveRequestProtocol(request)
  const ext = resolveAvatarExtension(file)
  const filename = `${Date.now()}-${randomUUID()}${ext}`
  const miniappAvatarUploadDir = resolveMiniappAvatarUploadDir()

  await mkdir(miniappAvatarUploadDir, { recursive: true })
  await writeFile(join(miniappAvatarUploadDir, filename), file.buffer)

  return `${protocol}://${host}${miniappAvatarPublicPrefix}/${filename}`
}

function resolveRequestProtocol(request: Request) {
  const forwardedProtocol = request.headers['x-forwarded-proto']

  if (typeof forwardedProtocol === 'string' && forwardedProtocol.trim()) {
    return forwardedProtocol.split(',')[0].trim()
  }

  return request.protocol
}

function resolveAvatarExtension(file: MiniappUploadedFile) {
  const fileExt = extname(file.originalname || '').toLowerCase()

  if (fileExt) {
    return fileExt
  }

  switch (file.mimetype) {
    case 'image/png':
      return '.png'
    case 'image/webp':
      return '.webp'
    case 'image/gif':
      return '.gif'
    default:
      return '.jpg'
  }
}
