import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import type { Prisma } from '@prisma/client'

import type { BannerJumpType, BannerStatus } from '@gaoge/shared-types'

import { PrismaService } from '@/common/prisma/prisma.service'

import type { BannerListDto } from './dto/banner-list.dto'
import type { CreateBannerDto } from './dto/create-banner.dto'
import type { ReorderBannerDto } from './dto/reorder-banner.dto'
import type { UpdateBannerDto } from './dto/update-banner.dto'

const bannerOrderBy: Prisma.BannerOrderByWithRelationInput[] = [{ sort: 'desc' }, { id: 'desc' }]

type BannerJumpInput = {
  jumpType?: BannerJumpType | null
  jumpUrl?: string | null
}

type NormalizedBannerJump = {
  jumpType: BannerJumpType
  jumpUrl: string | null
}

type BannerState = {
  title: string
  subtitle: string | null
  imageUrl: string
  jumpType: string
  jumpUrl: string | null
  sort: number
  status: string
}

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

  async create(dto: CreateBannerDto) {
    const data = await buildBannerCreateData(dto)

    return this.prisma.banner.create({
      data,
    })
  }

  async update(id: number, dto: UpdateBannerDto) {
    const current = await this.findOne(id)
    const data = await buildBannerUpdateData(current, dto)

    return this.prisma.banner.update({
      where: { id },
      data,
    })
  }

  async reorder(dto: ReorderBannerDto) {
    const ids = dto.items.map((item) => item.id)

    await this.prisma.$transaction(async (tx) => {
      const banners = await tx.banner.findMany({
        where: {
          id: {
            in: ids,
          },
        },
        select: {
          id: true,
        },
      })

      if (banners.length !== ids.length) {
        throw new BadRequestException('部分 Banner 不存在，无法排序')
      }

      for (const item of dto.items) {
        await tx.banner.update({
          where: { id: item.id },
          data: { sort: item.sort },
        })
      }
    })

    return this.prisma.banner.findMany({
      orderBy: bannerOrderBy,
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

export async function validateBannerJump(input: BannerJumpInput): Promise<NormalizedBannerJump> {
  const jumpType = input.jumpType ?? 'none'
  const jumpUrl = normalizeText(input.jumpUrl) ?? null

  if (jumpType === 'none') {
    return {
      jumpType,
      jumpUrl: null,
    }
  }

  if (jumpType === 'webview') {
    if (!jumpUrl) {
      throw new BadRequestException('网页链接不能为空')
    }
    if (!/^https?:\/\//.test(jumpUrl)) {
      throw new BadRequestException('网页链接必须以 http:// 或 https:// 开头')
    }
  }

  if (jumpType === 'miniapp') {
    if (!jumpUrl) {
      throw new BadRequestException('小程序页面路径不能为空')
    }
    if (!jumpUrl.startsWith('/pages/')) {
      throw new BadRequestException('小程序页面路径必须以 /pages/ 开头')
    }
  }

  return {
    jumpType,
    jumpUrl,
  }
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

async function buildBannerCreateData(
  dto: CreateBannerDto,
): Promise<Prisma.BannerUncheckedCreateInput> {
  const jump = await validateBannerJump({
    jumpType: dto.jumpType,
    jumpUrl: dto.jumpUrl,
  })

  return {
    title: normalizeRequiredText(dto.title, '轮播图标题不能为空'),
    subtitle: normalizeText(dto.subtitle) ?? null,
    imageUrl: normalizeRequiredText(dto.imageUrl, '轮播图图片不能为空'),
    jumpType: jump.jumpType,
    jumpUrl: jump.jumpUrl,
    sort: dto.sort ?? 0,
    status: dto.status ?? 'active',
  }
}

async function buildBannerUpdateData(
  current: BannerState,
  dto: UpdateBannerDto,
): Promise<Prisma.BannerUncheckedUpdateInput> {
  const nextState: BannerState = {
    title:
      typeof dto.title === 'string'
        ? normalizeRequiredText(dto.title, '轮播图标题不能为空')
        : current.title,
    subtitle:
      typeof dto.subtitle === 'string' ? (normalizeText(dto.subtitle) ?? null) : current.subtitle,
    imageUrl:
      typeof dto.imageUrl === 'string'
        ? normalizeRequiredText(dto.imageUrl, '轮播图图片不能为空')
        : current.imageUrl,
    jumpType: dto.jumpType ?? current.jumpType,
    jumpUrl:
      typeof dto.jumpUrl === 'string' ? (normalizeText(dto.jumpUrl) ?? null) : current.jumpUrl,
    sort: typeof dto.sort === 'number' ? dto.sort : current.sort,
    status: dto.status ?? current.status,
  }

  const jump = await validateBannerJump({
    jumpType: nextState.jumpType as BannerJumpType,
    jumpUrl: nextState.jumpUrl,
  })

  return {
    title: nextState.title,
    subtitle: nextState.subtitle,
    imageUrl: nextState.imageUrl,
    jumpType: jump.jumpType,
    jumpUrl: jump.jumpUrl,
    sort: nextState.sort,
    status: nextState.status as BannerStatus,
  }
}
