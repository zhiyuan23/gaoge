import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import type { Prisma } from '@prisma/client'

import type {
  AssetRecordDirection,
  AssetRecordListParams,
  AssetRecordSummary,
  AssetRecordType,
} from '@gaoge/shared-types'

import { PrismaService } from '@/common/prisma/prisma.service'

import type { AssetRecordListDto } from './dto/asset-record-list.dto'
import type { CreateAssetRecordDto } from './dto/create-asset-record.dto'
import type { UpdateAssetRecordDto } from './dto/update-asset-record.dto'

const INCOME_RECORD_TYPES: AssetRecordType[] = ['match_fee', 'extra_income']
const EXPENSE_RECORD_TYPES: AssetRecordType[] = ['equipment', 'activity', 'other_expense']

@Injectable()
export class AssetRecordService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateAssetRecordDto, creatorId: number) {
    const data = normalizeCreateAssetRecordPayload(dto, creatorId)

    return this.prisma.footballAssetRecord.create({
      data,
    })
  }

  async findAll(params: AssetRecordListDto | AssetRecordListParams = {}) {
    const page = normalizePositiveInteger(params.page, 1)
    const pageSize = normalizePositiveInteger(params.pageSize, 15)
    const where = buildAssetRecordWhere(params)
    const [list, total] = await this.prisma.$transaction([
      this.prisma.footballAssetRecord.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ recordDate: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
      }),
      this.prisma.footballAssetRecord.count({ where }),
    ])

    return {
      list,
      total,
    }
  }

  async getSummary(): Promise<AssetRecordSummary> {
    const [income, expense, waivedMatchCount] = await Promise.all([
      this.prisma.footballAssetRecord.aggregate({
        where: {
          direction: 'income',
          status: 'confirmed',
        },
        _sum: {
          amount: true,
        },
      }),
      this.prisma.footballAssetRecord.aggregate({
        where: {
          direction: 'expense',
          status: 'confirmed',
        },
        _sum: {
          amount: true,
        },
      }),
      this.prisma.footballAssetRecord.count({
        where: {
          direction: 'income',
          recordType: 'match_fee',
          status: 'confirmed',
          isWaived: true,
        },
      }),
    ])

    const totalIncome = income._sum.amount || 0
    const totalExpense = expense._sum.amount || 0

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      waivedMatchCount,
    }
  }

  async findOne(id: number) {
    const record = await this.prisma.footballAssetRecord.findUnique({
      where: { id },
    })

    if (!record) {
      throw new NotFoundException('资产记录不存在')
    }

    return record
  }

  async update(id: number, dto: UpdateAssetRecordDto) {
    const current = await this.findOne(id)
    const merged = mergeAssetRecordPayload(current, dto)
    validateAssetRecordPayload(merged)

    return this.prisma.footballAssetRecord.update({
      where: { id },
      data: normalizeUpdateAssetRecordPayload(dto),
    })
  }

  async remove(id: number) {
    await this.findOne(id)

    return this.prisma.footballAssetRecord.delete({
      where: { id },
    })
  }
}

function normalizePositiveInteger(value: unknown, fallback: number) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function normalizeText(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function normalizeNullableText(value: string | null | undefined) {
  if (value === undefined) {
    return undefined
  }

  if (value === null) {
    return null
  }

  const normalized = value.trim()
  return normalized ? normalized : null
}

function normalizeRecordDateEnd(date: Date) {
  return new Date(date.getTime() + 24 * 60 * 60 * 1000)
}

function normalizeQueryDate(value: string | Date | undefined) {
  if (!value) {
    return undefined
  }

  if (value instanceof Date) {
    return value
  }

  const parsed = new Date(`${value}T00:00:00.000Z`)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

function buildAssetRecordWhere(params: AssetRecordListDto | AssetRecordListParams) {
  const keyword = normalizeText(params.keyword)
  const direction = normalizeText(params.direction)
  const recordType = normalizeText(params.recordType)
  const seasonLabel = normalizeText(params.seasonLabel)
  const status = normalizeText(params.status)
  const startDate = normalizeQueryDate(params.startDate)
  const endDate = normalizeQueryDate(params.endDate)
  const where: Prisma.FootballAssetRecordWhereInput = {}

  if (keyword) {
    where.OR = [
      {
        title: {
          contains: keyword,
          mode: 'insensitive',
        },
      },
      {
        description: {
          contains: keyword,
          mode: 'insensitive',
        },
      },
    ]
  }

  if (direction) {
    where.direction = direction
  }

  if (recordType) {
    where.recordType = recordType
  }

  if (seasonLabel) {
    where.seasonLabel = {
      contains: seasonLabel,
      mode: 'insensitive',
    }
  }

  if (status) {
    where.status = status
  }

  if (startDate || endDate) {
    where.recordDate = {}

    if (startDate) {
      where.recordDate.gte = startDate
    }

    if (endDate) {
      where.recordDate.lt = normalizeRecordDateEnd(endDate)
    }
  }

  return where
}

function normalizeCreateAssetRecordPayload(dto: CreateAssetRecordDto, creatorId: number) {
  const payload = {
    direction: dto.direction,
    recordType: dto.recordType,
    amount: dto.amount,
    seasonLabel: normalizeNullableText(dto.seasonLabel),
    matchLabel: normalizeNullableText(dto.matchLabel),
    isWaived: dto.isWaived ?? false,
    title: dto.title.trim(),
    description: normalizeNullableText(dto.description),
    recordDate: dto.recordDate,
    status: dto.status ?? 'confirmed',
    creatorId,
  }

  validateAssetRecordPayload(payload)

  return payload
}

function normalizeUpdateAssetRecordPayload(dto: UpdateAssetRecordDto) {
  return {
    ...(dto.direction !== undefined ? { direction: dto.direction } : {}),
    ...(dto.recordType !== undefined ? { recordType: dto.recordType } : {}),
    ...(dto.amount !== undefined ? { amount: dto.amount } : {}),
    ...(dto.seasonLabel !== undefined
      ? { seasonLabel: normalizeNullableText(dto.seasonLabel) }
      : {}),
    ...(dto.matchLabel !== undefined ? { matchLabel: normalizeNullableText(dto.matchLabel) } : {}),
    ...(dto.isWaived !== undefined ? { isWaived: dto.isWaived } : {}),
    ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
    ...(dto.description !== undefined
      ? { description: normalizeNullableText(dto.description) }
      : {}),
    ...(dto.recordDate !== undefined ? { recordDate: dto.recordDate } : {}),
    ...(dto.status !== undefined ? { status: dto.status } : {}),
  }
}

function mergeAssetRecordPayload(
  current: {
    direction: string
    recordType: string
    amount: number
    seasonLabel: string | null
    matchLabel: string | null
    isWaived: boolean
    title: string
    description: string | null
    recordDate: Date
    status: string
  },
  dto: UpdateAssetRecordDto,
) {
  return {
    direction: dto.direction ?? current.direction,
    recordType: dto.recordType ?? current.recordType,
    amount: dto.amount ?? current.amount,
    seasonLabel:
      dto.seasonLabel !== undefined ? normalizeNullableText(dto.seasonLabel) : current.seasonLabel,
    matchLabel:
      dto.matchLabel !== undefined ? normalizeNullableText(dto.matchLabel) : current.matchLabel,
    isWaived: dto.isWaived ?? current.isWaived,
    title: dto.title !== undefined ? dto.title.trim() : current.title,
    description:
      dto.description !== undefined ? normalizeNullableText(dto.description) : current.description,
    recordDate: dto.recordDate ?? current.recordDate,
    status: dto.status ?? current.status,
  }
}

function validateAssetRecordPayload(payload: {
  direction: string
  recordType: string
  amount: number
  isWaived: boolean
  title: string
}) {
  if (!payload.title.trim()) {
    throw new BadRequestException('标题不能为空')
  }

  if (payload.isWaived) {
    if (
      payload.direction !== 'income' ||
      payload.recordType !== 'match_fee' ||
      payload.amount !== 0
    ) {
      throw new BadRequestException('免收记录仅允许比赛收入且金额必须为 0')
    }
    return
  }

  validateDirectionAndType(payload.direction as AssetRecordDirection, payload.recordType)

  if (payload.amount <= 0) {
    throw new BadRequestException('非免收记录金额必须大于 0')
  }
}

function validateDirectionAndType(direction: AssetRecordDirection, recordType: string) {
  if (direction === 'income' && !INCOME_RECORD_TYPES.includes(recordType as AssetRecordType)) {
    throw new BadRequestException('收入记录类型不合法')
  }

  if (direction === 'expense' && !EXPENSE_RECORD_TYPES.includes(recordType as AssetRecordType)) {
    throw new BadRequestException('支出记录类型不合法')
  }
}
