import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'

import type {
  CreateSystemPermissionPayload,
  SystemPermissionListParams,
  UpdateSystemPermissionPayload,
} from '@gaoge/shared-types'

import { PrismaService } from '@/common/prisma/prisma.service'
import { RbacSyncService } from '@/modules/system/rbac/rbac-sync.service'

@Injectable()
export class SystemPermissionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rbacSyncService: RbacSyncService,
  ) {}

  async findAll(params: SystemPermissionListParams = {}) {
    const keyword = normalizeOptionalText(params.keyword)
    const module = normalizeOptionalText(params.module)
    const status = normalizeOptionalText(params.status)

    const list = await this.prisma.permission.findMany({
      where: {
        ...(keyword
          ? {
              OR: [
                { code: { contains: keyword, mode: 'insensitive' } },
                { name: { contains: keyword, mode: 'insensitive' } },
              ],
            }
          : {}),
        ...(module ? { module } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: [{ module: 'asc' }, { code: 'asc' }],
    })

    return list.map(serializePermission)
  }

  async findGrouped() {
    const list = await this.findAll()
    const groups = Object.values(
      list.reduce<Record<string, { module: string; permissions: typeof list }>>((acc, item) => {
        const current = acc[item.module] ?? {
          module: item.module,
          permissions: [],
        }
        current.permissions.push(item)
        acc[item.module] = current
        return acc
      }, {}),
    )

    return { groups }
  }

  async create(payload: CreateSystemPermissionPayload) {
    const code = normalizePermissionCode(payload.code)
    const existing = await this.prisma.permission.findUnique({
      where: { code },
    })
    if (existing) {
      throw new ConflictException('权限码已存在')
    }

    const [module, resource, action] = code.split('.') as [string, string, string]
    const created = await this.prisma.permission.create({
      data: {
        code,
        name: normalizeRequiredText(payload.name, '权限名称不能为空'),
        module,
        resource,
        action,
        description: normalizeOptionalText(payload.description),
        status: payload.status,
        isBuiltIn: false,
      },
    })

    return serializePermission(created)
  }

  async update(id: number, payload: UpdateSystemPermissionPayload) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
    })
    if (!permission) {
      throw new NotFoundException('权限不存在')
    }

    const updated = await this.prisma.permission.update({
      where: { id },
      data: {
        name: normalizeRequiredText(payload.name, '权限名称不能为空'),
        description: normalizeOptionalText(payload.description),
        status: payload.status,
      },
    })

    return serializePermission(updated)
  }

  async remove(id: number) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
    })
    if (!permission) {
      throw new NotFoundException('权限不存在')
    }
    if (permission.isBuiltIn) {
      throw new BadRequestException('内置权限不允许删除')
    }

    const [roleBindingCount, menuBindingCount] = await Promise.all([
      this.prisma.rolePermission.count({
        where: { permissionId: id },
      }),
      this.prisma.menuPermission.count({
        where: { permissionId: id },
      }),
    ])
    if (roleBindingCount > 0) {
      throw new BadRequestException('权限已绑定角色，无法删除')
    }
    if (menuBindingCount > 0) {
      throw new BadRequestException('权限已绑定菜单，无法删除')
    }

    await this.prisma.permission.delete({
      where: { id },
    })

    return { id }
  }

  async syncBuiltIns() {
    return this.rbacSyncService.syncBuiltIns()
  }
}

function serializePermission(item: {
  id: number
  code: string
  name: string
  module: string
  resource: string
  action: string
  description: string | null
  status: string
  isBuiltIn: boolean
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: item.id,
    code: item.code,
    name: item.name,
    module: item.module,
    resource: item.resource,
    action: item.action,
    description: item.description,
    status: item.status,
    isBuiltIn: item.isBuiltIn,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }
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

function normalizePermissionCode(value: unknown) {
  const code = normalizeRequiredText(value, '权限码不能为空')
  const parts = code.split('.')
  const isValid = parts.length === 3 && parts.every((part) => /^[a-z][A-Za-z0-9-]*$/.test(part))

  if (!isValid) {
    throw new BadRequestException('权限码必须为 module.resource.action 格式')
  }

  return code
}
