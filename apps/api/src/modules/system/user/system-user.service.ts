import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import type { Prisma } from '@prisma/client'

import type { SystemUserListParams } from '@gaoge/shared-types'

import { hashPassword } from '@/common/auth/password.util'
import { PrismaService } from '@/common/prisma/prisma.service'

import type { CreateSystemUserDto } from './dto/create-system-user.dto'
import type { ResetSystemUserPasswordDto } from './dto/reset-system-user-password.dto'
import type { UpdateSystemUserDto } from './dto/update-system-user.dto'
import type { UpdateSystemUserStatusDto } from './dto/update-system-user-status.dto'

const systemUserSelect = {
  id: true,
  account: true,
  nickname: true,
  avatarUrl: true,
  role: true,
  status: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect

const systemUserLookupSelect = {
  ...systemUserSelect,
  deletedAt: true,
} satisfies Prisma.UserSelect

type SystemUserLookupRecord = Prisma.UserGetPayload<{
  select: typeof systemUserLookupSelect
}>

type BackendSystemUserLookupRecord = SystemUserLookupRecord & {
  account: string
}

@Injectable()
export class SystemUserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSystemUserDto) {
    const account = normalizeRequiredText(dto.account, '账号不能为空')
    const existingUser = await this.prisma.user.findFirst({
      where: {
        account,
        deletedAt: null,
      },
    })

    if (existingUser) {
      throw new ConflictException('账号已存在')
    }

    return this.prisma.user.create({
      data: {
        account,
        passwordHash: await hashPassword(normalizeRequiredPassword(dto.password, '密码不能为空')),
        nickname: normalizeRequiredText(dto.nickname, '昵称不能为空'),
        avatarUrl: normalizeOptionalText(dto.avatarUrl),
        role: dto.role,
        status: dto.status,
      },
      select: systemUserSelect,
    })
  }

  async findAll(params: SystemUserListParams = {}) {
    const page = normalizePositiveInteger(params.page, 1)
    const pageSize = normalizePositiveInteger(params.pageSize, 15)
    const where = buildSystemUserWhere(params)
    const [list, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: systemUserSelect,
      }),
      this.prisma.user.count({ where }),
    ])

    return {
      list,
      total,
    }
  }

  async update(id: number, dto: UpdateSystemUserDto) {
    const user = await this.findOneOrThrow(id)
    if (user.account === 'admin' && user.role === 'admin' && dto.role !== 'admin') {
      throw new BadRequestException('默认 admin 账号不允许降级')
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        nickname: normalizeRequiredText(dto.nickname, '昵称不能为空'),
        avatarUrl: normalizeOptionalText(dto.avatarUrl),
        role: dto.role,
      },
      select: systemUserSelect,
    })
  }

  async updateStatus(id: number, dto: UpdateSystemUserStatusDto) {
    const user = await this.findOneOrThrow(id)
    if (user.account === 'admin' && dto.status === 'inactive') {
      throw new BadRequestException('默认 admin 账号不允许停用')
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        status: dto.status,
      },
      select: systemUserSelect,
    })
  }

  async resetPassword(id: number, dto: ResetSystemUserPasswordDto) {
    await this.findOneOrThrow(id)

    return this.prisma.user.update({
      where: { id },
      data: {
        passwordHash: await hashPassword(
          normalizeRequiredPassword(dto.newPassword, '密码不能为空'),
        ),
      },
      select: systemUserSelect,
    })
  }

  async remove(id: number) {
    const user = await this.findOneOrThrow(id)
    if (user.account === 'admin') {
      throw new BadRequestException('默认 admin 账号不允许删除')
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        account: buildDeletedAccount(user.account, user.id),
        status: 'inactive',
        deletedAt: new Date(),
      },
      select: systemUserSelect,
    })
  }

  private async findOneOrThrow(id: number): Promise<BackendSystemUserLookupRecord> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: systemUserLookupSelect,
    })

    if (!user || user.deletedAt || user.account === null) {
      throw new NotFoundException('系统用户不存在')
    }

    return user as BackendSystemUserLookupRecord
  }
}

function normalizePositiveInteger(value: unknown, fallback: number) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function normalizeOptionalText(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function normalizeRequiredText(value: unknown, message: string) {
  const normalized = normalizeOptionalText(value)
  if (!normalized) {
    throw new BadRequestException(message)
  }

  return normalized
}

function normalizeRequiredPassword(value: unknown, message: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new BadRequestException(message)
  }

  return value
}

function buildSystemUserWhere(params: SystemUserListParams) {
  const keyword = normalizeOptionalText(params.keyword)
  const role = normalizeOptionalText(params.role)
  const status = normalizeOptionalText(params.status)
  const where: Prisma.UserWhereInput = {
    account: {
      not: null,
    },
    deletedAt: null,
  }

  if (keyword) {
    const keywordFilter = {
      contains: keyword,
      mode: 'insensitive',
    } satisfies Prisma.StringFilter

    where.OR = [{ account: keywordFilter }, { nickname: keywordFilter }]
  }
  if (role) {
    where.role = role
  }
  if (status) {
    where.status = status
  }

  return where
}

function buildDeletedAccount(account: string | null | undefined, id: number) {
  const normalizedAccount = normalizeOptionalText(account) ?? 'user'
  return `${normalizedAccount}__deleted__${id}`
}
