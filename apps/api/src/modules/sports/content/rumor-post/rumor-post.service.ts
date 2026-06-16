import { Injectable, NotFoundException } from '@nestjs/common'
import type { Prisma } from '@prisma/client'

import type {
  MiniappRumorPostItem,
  MiniappRumorPostListParams,
  MiniappRumorPostListResponse,
  RumorPost,
  RumorPostListParams,
  RumorPostListResponse,
  RumorPostPayload,
  RumorTagOption,
} from '@gaoge/shared-types'

import { PrismaService } from '@/common/prisma/prisma.service'

import type { CreateRumorPostDto } from './dto/create-rumor-post.dto'
import type { UpdateRumorPostDto } from './dto/update-rumor-post.dto'

const publishedFeedOrderBy: Prisma.MessageBoardPostOrderByWithRelationInput[] = [
  { isPinned: 'desc' },
  { publishedAt: 'desc' },
  { id: 'desc' },
]

@Injectable()
export class RumorPostService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateRumorPostDto) {
    const status = normalizeStatus(dto.status)
    const data: Prisma.MessageBoardPostCreateInput = {
      ...buildRumorPostData(dto),
      status,
      publishedAt: status === 'published' ? new Date() : null,
    }

    return this.prisma.messageBoardPost.create({ data })
  }

  async findAll(params: RumorPostListParams = {}): Promise<RumorPostListResponse> {
    const page = normalizePositiveInteger(params.page, 1)
    const pageSize = normalizePositiveInteger(params.pageSize, 15)
    const where = buildAdminWhere(params)
    const [list, total, tagRows] = await this.prisma.$transaction([
      this.prisma.messageBoardPost.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: {
          updatedAt: 'desc',
        },
      }),
      this.prisma.messageBoardPost.count({ where }),
      this.prisma.messageBoardPost.findMany({
        select: {
          tags: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
      }),
    ])

    return {
      list: list.map(serializeRumorPost),
      total,
      tagOptions: buildTagOptions(tagRows),
    }
  }

  async findOne(id: number) {
    return this.findExisting(id)
  }

  async update(id: number, dto: UpdateRumorPostDto) {
    const existing = await this.findExisting(id)
    const data = buildUpdateData(dto, existing)

    return this.prisma.messageBoardPost.update({
      where: { id },
      data,
    })
  }

  async remove(id: number) {
    await this.findExisting(id)

    return this.prisma.messageBoardPost.delete({
      where: { id },
    })
  }

  async publish(id: number) {
    const existing = await this.findExisting(id)

    return this.prisma.messageBoardPost.update({
      where: { id },
      data: {
        status: 'published',
        publishedAt: existing.publishedAt ?? new Date(),
      },
    })
  }

  async findPublishedForMiniapp(
    params: MiniappRumorPostListParams = {},
  ): Promise<MiniappRumorPostListResponse> {
    const page = normalizePositiveInteger(params.page, 1)
    const pageSize = normalizePositiveInteger(params.pageSize, 10)
    const where = buildPublishedWhere(params)
    const [list, total] = await this.prisma.$transaction([
      this.prisma.messageBoardPost.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: publishedFeedOrderBy,
        select: {
          id: true,
          title: true,
          content: true,
          tags: true,
          sourceName: true,
          sourceUrl: true,
          isPinned: true,
          publishedAt: true,
        },
      }),
      this.prisma.messageBoardPost.count({ where }),
    ])
    const tagOptions = await this.listPublishedTagOptions()

    return {
      list: list.map(serializeMiniappRumorPostItem),
      total,
      tagOptions,
    }
  }

  async listPublishedTagOptions(): Promise<RumorTagOption[]> {
    const rows = await this.prisma.messageBoardPost.findMany({
      where: {
        status: 'published',
      },
      select: {
        tags: true,
      },
      orderBy: publishedFeedOrderBy,
    })

    return buildTagOptions(rows)
  }

  private async findExisting(id: number) {
    const post = await this.prisma.messageBoardPost.findUnique({
      where: { id },
    })

    if (!post) {
      throw new NotFoundException('流言板动态不存在')
    }

    return post
  }
}

function normalizePositiveInteger(value: unknown, fallback: number) {
  const parsed = Number(value)

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function normalizeText(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function normalizeTags(tags: RumorPostPayload['tags']) {
  if (!Array.isArray(tags)) {
    return []
  }

  return Array.from(new Set(tags.map((tag) => tag.trim()).filter(Boolean)))
}

function normalizeStatus(value: unknown): 'draft' | 'published' {
  return value === 'published' ? 'published' : 'draft'
}

function buildRumorPostData(
  payload: Pick<
    RumorPostPayload,
    'title' | 'content' | 'tags' | 'sourceName' | 'sourceUrl' | 'isPinned'
  >,
): Prisma.MessageBoardPostUncheckedCreateInput {
  return {
    title: payload.title.trim(),
    content: payload.content.trim(),
    tags: normalizeTags(payload.tags),
    sourceName: payload.sourceName.trim(),
    sourceUrl: normalizeText(payload.sourceUrl),
    isPinned: Boolean(payload.isPinned),
  }
}

function buildUpdateData(
  payload: UpdateRumorPostDto,
  existing: {
    status: string
    publishedAt: Date | null
  },
): Prisma.MessageBoardPostUncheckedUpdateInput {
  const data: Prisma.MessageBoardPostUncheckedUpdateInput = {}

  if (typeof payload.title === 'string') {
    data.title = payload.title.trim()
  }
  if (typeof payload.content === 'string') {
    data.content = payload.content.trim()
  }
  if (Array.isArray(payload.tags)) {
    data.tags = normalizeTags(payload.tags)
  }
  if (typeof payload.sourceName === 'string') {
    data.sourceName = payload.sourceName.trim()
  }
  if (typeof payload.sourceUrl === 'string') {
    data.sourceUrl = normalizeText(payload.sourceUrl) ?? null
  }
  if (typeof payload.isPinned === 'boolean') {
    data.isPinned = payload.isPinned
  }

  const nextStatus = payload.status ? normalizeStatus(payload.status) : undefined

  if (existing.status === 'published') {
    data.status = 'published'
    data.publishedAt = existing.publishedAt ?? new Date()
  } else if (nextStatus === 'published') {
    data.status = 'published'
    data.publishedAt = existing.publishedAt ?? new Date()
  } else if (nextStatus === 'draft') {
    data.status = 'draft'
  }

  return data
}

function buildAdminWhere(params: RumorPostListParams) {
  const keyword = normalizeText(params.keyword)
  const status = normalizeText(params.status)
  const tag = normalizeText(params.tag)
  const where: Prisma.MessageBoardPostWhereInput = {}

  if (status) {
    where.status = status
  }
  if (tag) {
    where.tags = {
      has: tag,
    }
  }
  if (keyword) {
    const contains = {
      contains: keyword,
      mode: 'insensitive',
    } satisfies Prisma.StringFilter

    where.OR = [{ title: contains }, { content: contains }, { sourceName: contains }]
  }

  return where
}

function buildPublishedWhere(params: MiniappRumorPostListParams) {
  const tag = normalizeText(params.tag)
  const where: Prisma.MessageBoardPostWhereInput = {
    status: 'published',
  }

  if (tag) {
    where.tags = {
      has: tag,
    }
  }

  return where
}

function buildTagOptions(rows: Array<{ tags: string[] }>): RumorTagOption[] {
  const seen = new Set<string>()
  const list: RumorTagOption[] = []

  for (const row of rows) {
    for (const rawTag of row.tags) {
      const tag = rawTag.trim()

      if (!tag || seen.has(tag)) {
        continue
      }

      seen.add(tag)
      list.push({
        label: tag,
        value: tag,
      })
    }
  }

  return list
}

function serializeRumorPost(post: {
  id: number
  title: string
  content: string
  tags: string[]
  sourceName: string
  sourceUrl: string | null
  status: string
  isPinned: boolean
  publishedAt: Date | null
  createdAt: Date
  updatedAt: Date
}): RumorPost {
  return {
    id: post.id,
    title: post.title,
    content: post.content,
    tags: post.tags,
    sourceName: post.sourceName,
    sourceUrl: post.sourceUrl,
    status: normalizeStatus(post.status),
    isPinned: post.isPinned,
    publishedAt: post.publishedAt?.toISOString() ?? null,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  }
}

function serializeMiniappRumorPostItem(post: {
  id: number
  title: string
  content: string
  tags: string[]
  sourceName: string
  sourceUrl: string | null
  isPinned: boolean
  publishedAt: Date | null
}): MiniappRumorPostItem {
  return {
    id: post.id,
    title: post.title,
    content: post.content,
    tags: post.tags,
    sourceName: post.sourceName,
    sourceUrl: post.sourceUrl,
    isPinned: post.isPinned,
    publishedAt: post.publishedAt?.toISOString() ?? null,
  }
}
