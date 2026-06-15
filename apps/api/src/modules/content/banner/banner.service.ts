import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import type { Prisma } from '@prisma/client'

import { PrismaService } from '@/common/prisma/prisma.service'

import type { BannerListDto } from './dto/banner-list.dto'
import type { CreateBannerDto } from './dto/create-banner.dto'
import type { UpdateBannerDto } from './dto/update-banner.dto'

const bannerOrderBy: Prisma.BannerOrderByWithRelationInput[] = [{ sort: 'desc' }, { id: 'desc' }]

@Injectable()
export class BannerService {
  constructor(private readonly prisma: PrismaService) {}

  findPublished() {
    return this.prisma.banner.findMany({
      where: { status: 'active' },
      orderBy: bannerOrderBy,
    })
  }

  findAll(params: BannerListDto = {}) {
    return this.prisma.banner.findMany({
      where: buildBannerWhere(params),
      orderBy: bannerOrderBy,
    })
  }

  async findOne(id: number) {
    const banner = await this.prisma.banner.findUnique({
      where: { id },
    })

    if (!banner) {
      throw new NotFoundException('轮播图不存在')
    }

    return banner
  }

  create(dto: CreateBannerDto) {
    return this.prisma.banner.create({
      data: {
        title: normalizeRequiredText(dto.title, '轮播图标题不能为空'),
        imageUrl: normalizeRequiredText(dto.imageUrl, '轮播图图片不能为空'),
        jumpType: dto.jumpType ?? 'none',
        jumpUrl: normalizeText(dto.jumpUrl) ?? null,
        sort: dto.sort ?? 0,
        status: dto.status ?? 'active',
      },
    })
  }

  async update(id: number, dto: UpdateBannerDto) {
    await this.findOne(id)

    return this.prisma.banner.update({
      where: { id },
      data: buildBannerUpdateData(dto),
    })
  }

  async remove(id: number) {
    await this.findOne(id)

    return this.prisma.banner.delete({
      where: { id },
    })
  }
}

function normalizeText(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function normalizeRequiredText(value: unknown, errorMessage: string) {
  const normalized = normalizeText(value)

  if (!normalized) {
    throw new BadRequestException(errorMessage)
  }

  return normalized
}

function buildBannerWhere(params: BannerListDto) {
  const where: Prisma.BannerWhereInput = {}
  const keyword = normalizeText(params.keyword)

  if (params.status) {
    where.status = params.status
  }
  if (params.jumpType) {
    where.jumpType = params.jumpType
  }
  if (keyword) {
    where.title = {
      contains: keyword,
      mode: 'insensitive',
    }
  }

  return where
}

function buildBannerUpdateData(dto: UpdateBannerDto) {
  const data: Prisma.BannerUncheckedUpdateInput = {}

  if (typeof dto.title === 'string') {
    data.title = normalizeRequiredText(dto.title, '轮播图标题不能为空')
  }
  if (typeof dto.imageUrl === 'string') {
    data.imageUrl = normalizeRequiredText(dto.imageUrl, '轮播图图片不能为空')
  }
  if (dto.jumpType) {
    data.jumpType = dto.jumpType
  }
  if (typeof dto.jumpUrl === 'string') {
    data.jumpUrl = normalizeText(dto.jumpUrl) ?? null
  }
  if (typeof dto.sort === 'number') {
    data.sort = dto.sort
  }
  if (dto.status) {
    data.status = dto.status
  }

  return data
}
