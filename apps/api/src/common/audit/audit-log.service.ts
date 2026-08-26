import { Injectable } from '@nestjs/common'
import type { Prisma } from '@prisma/client'

import { getCurrentRequestId } from '@/common/http/request-context'
import { PrismaService } from '@/common/prisma/prisma.service'

export type AuditAction =
  | 'SYSTEM_USER_CREATED'
  | 'SYSTEM_USER_UPDATED'
  | 'SYSTEM_USER_STATUS_CHANGED'
  | 'SYSTEM_USER_DELETED'
  | 'SYSTEM_USER_PASSWORD_RESET'
  | 'SYSTEM_ROLE_CREATED'
  | 'SYSTEM_ROLE_UPDATED'
  | 'SYSTEM_ROLE_STATUS_CHANGED'
  | 'SYSTEM_ROLE_DELETED'
  | 'SYSTEM_ROLE_PERMISSIONS_REPLACED'
  | 'SYSTEM_PERMISSION_CREATED'
  | 'SYSTEM_PERMISSION_UPDATED'
  | 'SYSTEM_PERMISSION_DELETED'
  | 'SYSTEM_PERMISSION_BUILTINS_SYNCED'
  | 'SYSTEM_RESOURCE_CREATED'
  | 'SYSTEM_RESOURCE_UPDATED'
  | 'SYSTEM_RESOURCE_STATUS_CHANGED'
  | 'SYSTEM_RESOURCE_DELETED'
  | 'SYSTEM_MENU_CREATED'
  | 'SYSTEM_MENU_UPDATED'
  | 'SYSTEM_MENU_DELETED'
  | 'SYSTEM_MENU_RESOURCES_REPLACED'

export type AuditEntityType = 'User' | 'Role' | 'Permission' | 'Resource' | 'Menu'

type AuditInput = {
  action: AuditAction
  result?: 'SUCCEEDED' | 'DENIED'
  actorUserId?: number
  entityType?: AuditEntityType
  entityId?: number | string
  requestId?: string
  metadata?: Record<string, unknown>
}

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  record(input: AuditInput, transaction?: Prisma.TransactionClient) {
    const requestId = input.requestId ?? getCurrentRequestId()
    const data: Prisma.AuditEventUncheckedCreateInput = {
      action: input.action,
      result: input.result ?? 'SUCCEEDED',
      ...(input.actorUserId ? { actorUserId: input.actorUserId } : {}),
      ...(input.entityType ? { entityType: input.entityType } : {}),
      ...(input.entityId !== undefined ? { entityId: String(input.entityId) } : {}),
      ...(requestId ? { requestId } : {}),
      ...(input.metadata ? { metadata: input.metadata as Prisma.InputJsonValue } : {}),
    }
    return (transaction ?? this.prisma).auditEvent.create({ data })
  }
}
