import { Injectable } from '@nestjs/common'
import type { Prisma } from '@prisma/client'

import { PrismaService } from '@/common/prisma/prisma.service'

import type { SystemAuditListDto } from './dto/system-audit-list.dto'

const sensitiveMetadataKeyFragments = [
  'password',
  'token',
  'cookie',
  'secret',
  'authorization',
  'credential',
  'apikey',
  'privatekey',
  'sessionid',
]

@Injectable()
export class SystemAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: SystemAuditListDto) {
    const where: Prisma.AuditEventWhereInput = {
      ...(query.action ? { action: query.action.trim() } : {}),
      ...(query.result ? { result: query.result.trim() } : {}),
      ...(query.entityType ? { entityType: query.entityType.trim() } : {}),
      ...(query.entityId ? { entityId: query.entityId.trim() } : {}),
      ...(query.requestId ? { requestId: query.requestId.trim() } : {}),
      ...(query.from || query.to
        ? {
            createdAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
    }
    const [list, total] = await this.prisma.$transaction([
      this.prisma.auditEvent.findMany({
        where,
        select: {
          id: true,
          action: true,
          result: true,
          entityType: true,
          entityId: true,
          requestId: true,
          metadata: true,
          createdAt: true,
          actorUser: { select: { id: true, account: true, nickname: true } },
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.auditEvent.count({ where }),
    ])

    return {
      list: list.map((event) => ({
        id: event.id.toString(),
        action: event.action,
        result: event.result,
        actor: event.actorUser,
        entityType: event.entityType,
        entityId: event.entityId,
        requestId: event.requestId,
        metadata: sanitizeMetadata(event.metadata),
        createdAt: event.createdAt.toISOString(),
      })),
      total,
      page: query.page,
      pageSize: query.pageSize,
    }
  }
}

function sanitizeMetadata(metadata: Prisma.JsonValue | null): Record<string, unknown> | null {
  if (!metadata || Array.isArray(metadata) || typeof metadata !== 'object') {
    return null
  }
  return sanitizeValue(metadata) as Record<string, unknown>
}

function sanitizeValue(value: Prisma.JsonValue): unknown {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue)
  }
  if (!value || typeof value !== 'object') {
    return value
  }
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !isSensitiveMetadataKey(key))
      .map(([key, child]) => [key, sanitizeValue(child as Prisma.JsonValue)]),
  )
}

function isSensitiveMetadataKey(key: string) {
  const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, '')
  return sensitiveMetadataKeyFragments.some((fragment) => normalized.includes(fragment))
}
