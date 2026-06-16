import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { extname, join } from 'node:path'
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import type { Request } from 'express'

import { RequirePermissions } from '@/common/auth/permissions.decorator'
import { PermissionsGuard } from '@/common/auth/permissions.guard'
import {
  contentBannerPublicPrefix,
  resolveContentBannerUploadDir,
} from '@/common/storage/upload-path'
import { JwtAuthGuard } from '@/modules/auth/jwt-auth.guard'

import { BannerListDto } from './dto/banner-list.dto'
import { CreateBannerDto } from './dto/create-banner.dto'
import { ReorderBannerDto } from './dto/reorder-banner.dto'
import { UpdateBannerDto } from './dto/update-banner.dto'
import { BannerService } from './banner.service'

type BannerUploadedFile = {
  buffer: Buffer
  mimetype: string
  originalname: string
}

@Controller('content/banners')
export class BannerController {
  constructor(private readonly bannerService: BannerService) {}

  @Get()
  findPublished() {
    return this.bannerService.findPublished()
  }

  @Get('list')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('content.banner.view')
  findAll(@Query() query: BannerListDto) {
    return this.bannerService.findAll(query)
  }

  @Patch('reorder')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('content.banner.update')
  reorder(@Body() dto: ReorderBannerDto) {
    return this.bannerService.reorder(dto)
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('content.banner.view')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.bannerService.findOne(id)
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('content.banner.create')
  create(@Body() dto: CreateBannerDto) {
    return this.bannerService.create(dto)
  }

  @Post('upload-image')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('content.banner.create')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  async uploadImage(@Req() request: Request, @UploadedFile() file?: BannerUploadedFile) {
    const imageUrl = await saveBannerImage(request, file)

    return { imageUrl }
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('content.banner.update')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBannerDto) {
    return this.bannerService.update(id, dto)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('content.banner.delete')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.bannerService.remove(id)
  }
}

async function saveBannerImage(request: Request, file?: BannerUploadedFile) {
  if (!file?.buffer?.length) {
    throw new BadRequestException('请上传 Banner 图片')
  }

  if (!file.mimetype?.startsWith('image/')) {
    throw new BadRequestException('Banner 图片格式不正确')
  }

  const host = request.get('host')

  if (!host) {
    throw new BadRequestException('无法识别上传地址')
  }

  const protocol = resolveRequestProtocol(request)
  const filename = `${Date.now()}-${randomUUID()}${resolveImageExtension(file)}`
  const uploadDir = resolveContentBannerUploadDir()

  await mkdir(uploadDir, { recursive: true })
  await writeFile(join(uploadDir, filename), file.buffer)

  return `${protocol}://${host}${contentBannerPublicPrefix}/${filename}`
}

function resolveRequestProtocol(request: Request) {
  const forwardedProtocol = request.headers['x-forwarded-proto']

  if (typeof forwardedProtocol === 'string' && forwardedProtocol.trim()) {
    return forwardedProtocol.split(',')[0].trim()
  }

  return request.protocol
}

function resolveImageExtension(file: BannerUploadedFile) {
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
