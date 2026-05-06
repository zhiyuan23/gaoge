# System Management First Phase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the `系统管理` top-level admin menu, ship a working first-phase `用户管理` module, and reserve stable route and permission structure for `角色管理 / 菜单管理 / 权限管理`.

**Architecture:** Keep the first phase aligned with the current repo shape: admin menus and routes remain frontend-defined, while the API adds a new `system/user` business module on top of the existing `User` table. Reuse the existing `role/status/deletedAt` user fields instead of introducing RBAC tables now, and return the new `system.*` permissions from the auth module so menu visibility, button auth, and future role work all share the same vocabulary.

**Tech Stack:** Prisma existing `User` model, NestJS, class-validator, shared workspace types, Vue 3, Pinia, Element Plus, TypeScript

---

### Task 1: Shared contracts and permission vocabulary

**Files:**

- Create: `packages/shared/types/src/system-user.ts`
- Modify: `packages/shared/types/src/index.ts`
- Modify: `apps/api/src/modules/auth/services/auth.service.spec.ts`
- Modify: `apps/api/src/modules/auth/services/auth.service.ts`
- Test: `apps/api/src/modules/auth/services/auth.service.spec.ts`

- [ ] **Step 1: Write the failing auth permission test**

```ts
it('returns system management permissions for admin users', async () => {
  const { prisma, service } = createService()
  prisma.user.findUnique = jest.fn().mockResolvedValue({
    id: 1,
    role: 'admin',
    status: 'active',
    deletedAt: null,
  })

  await expect(service.getPermission(1)).resolves.toEqual({
    permissions: expect.arrayContaining([
      'system.user.view',
      'system.user.create',
      'system.user.update',
      'system.user.enable',
      'system.user.disable',
      'system.user.reset-password',
      'system.user.delete',
      'system.role.view',
      'system.menu.view',
      'system.permission.view',
    ]),
    role: 'admin',
  })
})
```

- [ ] **Step 2: Run the auth test to verify it fails**

Run: `pnpm --filter @gaoge/app-api test -- auth.service.spec.ts --runInBand`
Expected: FAIL because `getPermission()` does not include any `system.*` permission yet

- [ ] **Step 3: Add the shared system-user contracts and expand admin permissions**

```ts
// packages/shared/types/src/system-user.ts
import type { DateTimeString } from './common.js'
import type { UserRole, UserStatus } from './auth.js'

export interface SystemUser {
  id: number
  account: string
  nickname: string | null
  avatarUrl: string | null
  role: UserRole
  status: UserStatus
  lastLoginAt: DateTimeString | null
  createdAt: DateTimeString
  updatedAt: DateTimeString
}

export interface SystemUserListParams {
  page?: number
  pageSize?: number
  keyword?: string
  role?: UserRole
  status?: UserStatus
}

export interface SystemUserListResponse {
  list: SystemUser[]
  total: number
}

export interface CreateSystemUserPayload {
  account: string
  password: string
  nickname: string
  avatarUrl?: string
  role: UserRole
  status: UserStatus
}

export interface UpdateSystemUserPayload {
  nickname: string
  avatarUrl?: string
  role: UserRole
}

export interface UpdateSystemUserStatusPayload {
  status: UserStatus
}

export interface ResetSystemUserPasswordPayload {
  newPassword: string
}
```

```ts
// packages/shared/types/src/index.ts
export type * from './auth.js'
export type * from './banner.js'
export type * from './common.js'
export type * from './player.js'
export type * from './system-user.js'
export type * from './team.js'
```

```ts
// apps/api/src/modules/auth/services/auth.service.ts
private buildPermissions(role: string) {
  if (role === 'admin') {
    return [
      'player:create',
      'player:update',
      'player:delete',
      'team:create',
      'team:update',
      'team:delete',
      'matchRound:create',
      'matchRound:update',
      'matchRound:delete',
      'fund:create',
      'fund:update',
      'fund:delete',
      'system.user.view',
      'system.user.create',
      'system.user.update',
      'system.user.enable',
      'system.user.disable',
      'system.user.reset-password',
      'system.user.delete',
      'system.role.view',
      'system.menu.view',
      'system.permission.view',
    ]
  }

  return []
}
```

- [ ] **Step 4: Re-run the auth test**

Run: `pnpm --filter @gaoge/app-api test -- auth.service.spec.ts --runInBand`
Expected: PASS

- [ ] **Step 5: Commit the shared contract slice**

```bash
git add packages/shared/types/src/system-user.ts \
  packages/shared/types/src/index.ts \
  apps/api/src/modules/auth/services/auth.service.ts \
  apps/api/src/modules/auth/services/auth.service.spec.ts
git commit -m "feat: add system user contracts"
```

### Task 2: Backend system user module

**Files:**

- Create: `apps/api/src/modules/system/system.module.ts`
- Create: `apps/api/src/modules/system/user/system-user.module.ts`
- Create: `apps/api/src/modules/system/user/system-user.controller.ts`
- Create: `apps/api/src/modules/system/user/system-user.service.ts`
- Create: `apps/api/src/modules/system/user/system-user.service.spec.ts`
- Create: `apps/api/src/modules/system/user/dto/create-system-user.dto.ts`
- Create: `apps/api/src/modules/system/user/dto/update-system-user.dto.ts`
- Create: `apps/api/src/modules/system/user/dto/update-system-user-status.dto.ts`
- Create: `apps/api/src/modules/system/user/dto/reset-system-user-password.dto.ts`
- Modify: `apps/api/src/app.module.ts`
- Test: `apps/api/src/modules/system/user/system-user.service.spec.ts`

- [ ] **Step 1: Write the failing system user service tests**

```ts
import { SystemUserService } from './system-user.service'

describe('SystemUserService', () => {
  const createService = () => {
    const prisma = {
      user: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn((actions: Promise<unknown>[]) => Promise.all(actions)),
    }

    return {
      prisma,
      service: new SystemUserService(prisma as any),
    }
  }

  it('filters system users by account or nickname and excludes deleted records', async () => {
    const { prisma, service } = createService()

    await service.findAll({ keyword: 'admin' })

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          deletedAt: null,
          OR: [
            { account: { contains: 'admin', mode: 'insensitive' } },
            { nickname: { contains: 'admin', mode: 'insensitive' } },
          ],
        },
      }),
    )
  })

  it('hashes the password when creating a system user', async () => {
    const { prisma, service } = createService()
    prisma.user.create.mockResolvedValue({ id: 1 })

    await service.create({
      account: 'ops-admin',
      password: 'Admin@123456',
      nickname: '运维管理员',
      role: 'admin',
      status: 'active',
    })

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        account: 'ops-admin',
        nickname: '运维管理员',
        role: 'admin',
        status: 'active',
        passwordHash: expect.any(String),
      }),
    })
  })

  it('soft deletes users through deletedAt', async () => {
    const { prisma, service } = createService()
    prisma.user.findUnique.mockResolvedValue({
      id: 7,
      account: 'archived-user',
      deletedAt: null,
      status: 'active',
      role: 'user',
    })
    prisma.user.update.mockResolvedValue({ id: 7 })

    await service.remove(7)

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: expect.objectContaining({
        deletedAt: expect.any(Date),
      }),
    })
  })
})
```

- [ ] **Step 2: Run the backend user service test to verify it fails**

Run: `pnpm --filter @gaoge/app-api test -- system-user.service.spec.ts --runInBand`
Expected: FAIL because the `system/user` module does not exist yet

- [ ] **Step 3: Implement the new system user module**

```ts
// apps/api/src/modules/system/user/system-user.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'

import { Roles } from '@/common/auth/roles.decorator'
import { RolesGuard } from '@/common/auth/roles.guard'
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard'

import { CreateSystemUserDto } from './dto/create-system-user.dto'
import { ResetSystemUserPasswordDto } from './dto/reset-system-user-password.dto'
import { UpdateSystemUserStatusDto } from './dto/update-system-user-status.dto'
import { UpdateSystemUserDto } from './dto/update-system-user.dto'
import { SystemUserService } from './system-user.service'

@Controller('system/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class SystemUserController {
  constructor(private readonly systemUserService: SystemUserService) {}

  @Post()
  create(@Body() dto: CreateSystemUserDto) {
    return this.systemUserService.create(dto)
  }

  @Get()
  findAll(@Query() query: Record<string, string | undefined>) {
    return this.systemUserService.findAll(query)
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSystemUserDto) {
    return this.systemUserService.update(id, dto)
  }

  @Patch(':id/status')
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSystemUserStatusDto) {
    return this.systemUserService.updateStatus(id, dto)
  }

  @Patch(':id/reset-password')
  resetPassword(@Param('id', ParseIntPipe) id: number, @Body() dto: ResetSystemUserPasswordDto) {
    return this.systemUserService.resetPassword(id, dto)
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.systemUserService.remove(id)
  }
}
```

```ts
// apps/api/src/modules/system/user/dto/create-system-user.dto.ts
import { IsIn, IsOptional, IsString, Length } from 'class-validator'

export class CreateSystemUserDto {
  @IsString()
  @Length(3, 32)
  account: string

  @IsString()
  @Length(6, 18)
  password: string

  @IsString()
  @Length(1, 20)
  nickname: string

  @IsOptional()
  @IsString()
  avatarUrl?: string

  @IsIn(['admin', 'user'])
  role: 'admin' | 'user'

  @IsIn(['active', 'inactive'])
  status: 'active' | 'inactive'
}
```

```ts
// apps/api/src/modules/system/user/dto/update-system-user.dto.ts
import { IsIn, IsOptional, IsString, Length } from 'class-validator'

export class UpdateSystemUserDto {
  @IsString()
  @Length(1, 20)
  nickname: string

  @IsOptional()
  @IsString()
  avatarUrl?: string

  @IsIn(['admin', 'user'])
  role: 'admin' | 'user'
}
```

```ts
// apps/api/src/modules/system/user/dto/update-system-user-status.dto.ts
import { IsIn } from 'class-validator'

export class UpdateSystemUserStatusDto {
  @IsIn(['active', 'inactive'])
  status: 'active' | 'inactive'
}
```

```ts
// apps/api/src/modules/system/user/dto/reset-system-user-password.dto.ts
import { IsString, Length } from 'class-validator'

export class ResetSystemUserPasswordDto {
  @IsString()
  @Length(6, 18)
  newPassword: string
}
```

```ts
// apps/api/src/modules/system/user/system-user.service.ts
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
import type { UpdateSystemUserStatusDto } from './dto/update-system-user-status.dto'
import type { UpdateSystemUserDto } from './dto/update-system-user.dto'

@Injectable()
export class SystemUserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSystemUserDto) {
    const existing = await this.prisma.user.findFirst({
      where: {
        account: dto.account.trim(),
        deletedAt: null,
      },
    })

    if (existing) {
      throw new ConflictException('登录账号已存在')
    }

    return this.prisma.user.create({
      data: {
        account: dto.account.trim(),
        passwordHash: await hashPassword(dto.password),
        nickname: dto.nickname.trim(),
        avatarUrl: normalizeNullableText(dto.avatarUrl),
        role: dto.role,
        status: dto.status,
      },
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
        orderBy: [{ createdAt: 'desc' }],
      }),
      this.prisma.user.count({ where }),
    ])

    return { list, total }
  }

  async update(id: number, dto: UpdateSystemUserDto) {
    await this.findOne(id)
    return this.prisma.user.update({
      where: { id },
      data: {
        nickname: dto.nickname.trim(),
        avatarUrl: normalizeNullableText(dto.avatarUrl),
        role: dto.role,
      },
    })
  }

  async updateStatus(id: number, dto: UpdateSystemUserStatusDto) {
    await this.findOne(id)
    return this.prisma.user.update({
      where: { id },
      data: { status: dto.status },
    })
  }

  async resetPassword(id: number, dto: ResetSystemUserPasswordDto) {
    await this.findOne(id)
    return this.prisma.user.update({
      where: { id },
      data: {
        passwordHash: await hashPassword(dto.newPassword),
      },
    })
  }

  async remove(id: number) {
    const user = await this.findOne(id)
    if (user.role === 'admin' && user.account === 'admin') {
      throw new BadRequestException('默认管理员账号不允许删除')
    }
    return this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'inactive',
      },
    })
  }

  private async findOne(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } })
    if (!user || user.deletedAt) {
      throw new NotFoundException('系统用户不存在')
    }
    return user
  }
}

function normalizePositiveInteger(value: unknown, fallback: number) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function normalizeNullableText(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function buildSystemUserWhere(params: SystemUserListParams): Prisma.UserWhereInput {
  const keyword =
    typeof params.keyword === 'string' && params.keyword.trim() ? params.keyword.trim() : undefined
  const where: Prisma.UserWhereInput = {
    deletedAt: null,
  }

  if (keyword) {
    where.OR = [
      { account: { contains: keyword, mode: 'insensitive' } },
      { nickname: { contains: keyword, mode: 'insensitive' } },
    ]
  }

  if (params.role) {
    where.role = params.role
  }

  if (params.status) {
    where.status = params.status
  }

  return where
}
```

```ts
// apps/api/src/modules/system/system.module.ts
import { Module } from '@nestjs/common'

import { SystemUserModule } from './user/system-user.module'

@Module({
  imports: [SystemUserModule],
})
export class SystemModule {}
```

```ts
// apps/api/src/modules/system/user/system-user.module.ts
import { Module } from '@nestjs/common'

import { SystemUserController } from './system-user.controller'
import { SystemUserService } from './system-user.service'

@Module({
  controllers: [SystemUserController],
  providers: [SystemUserService],
})
export class SystemUserModule {}
```

```ts
// apps/api/src/app.module.ts
import { SystemModule } from './modules/system/system.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule,
    WechatModule,
    HealthModule,
    FootballModule,
    AuthModule,
    BannerModule,
    SystemModule,
  ],
})
export class AppModule {}
```

- [ ] **Step 4: Re-run the backend service test**

Run: `pnpm --filter @gaoge/app-api test -- system-user.service.spec.ts --runInBand`
Expected: PASS

- [ ] **Step 5: Commit the backend system user slice**

```bash
git add apps/api/src/modules/system \
  apps/api/src/app.module.ts
git commit -m "feat: add system user api"
```

### Task 3: Admin system route skeleton and placeholders

**Files:**

- Create: `apps/admin/src/router/modules/system/index.ts`
- Create: `apps/admin/src/views/system/role/index.vue`
- Create: `apps/admin/src/views/system/menu/index.vue`
- Create: `apps/admin/src/views/system/permission/index.vue`
- Modify: `apps/admin/src/router/routes.ts`
- Modify: `apps/admin/scripts/menu-route-structure.check.ts`

- [ ] **Step 1: Extend the menu route structure check first**

```ts
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const adminRoot = path.resolve(import.meta.dirname, '..')
const systemModulePath = path.join(adminRoot, 'src/router/modules/system/index.ts')
const routesFilePath = path.join(adminRoot, 'src/router/routes.ts')

assert(existsSync(systemModulePath), '缺少系统管理路由模块：src/router/modules/system/index.ts')

const routesSource = readFileSync(routesFilePath, 'utf8')

assert(routesSource.includes("title: '系统管理'"), '顶层菜单里缺少“系统管理”分组')
assert(routesSource.includes('children: [System]'), '顶层菜单里没有挂载系统管理模块')
assert(routesSource.includes("path: '/system'"), '系统管理模块缺少 /system 路径前缀')

console.log('menu route structure check passed')
```

- [ ] **Step 2: Run the route structure check to verify it fails**

Run: `pnpm --filter @gaoge/app-admin exec esno scripts/menu-route-structure.check.ts`
Expected: FAIL because the `system` route module is not present yet

- [ ] **Step 3: Add the system route module and placeholder pages**

```ts
// apps/admin/src/router/modules/system/index.ts
import type { RouteRecordRaw } from 'vue-router'

function Layout() {
  return import('@/layouts/index.vue')
}

const routes: RouteRecordRaw = {
  path: '/system',
  component: Layout,
  name: 'system',
  meta: {
    title: '系统管理',
    icon: 'ri:settings-3-line',
  },
  children: [
    {
      path: 'user',
      name: 'systemUser',
      component: () => import('@/views/system/user/index.vue'),
      meta: {
        title: '用户管理',
        auth: ['system.user.view'],
      },
    },
    {
      path: 'role',
      name: 'systemRole',
      component: () => import('@/views/system/role/index.vue'),
      meta: {
        title: '角色管理',
        auth: ['system.role.view'],
      },
    },
    {
      path: 'menu',
      name: 'systemMenu',
      component: () => import('@/views/system/menu/index.vue'),
      meta: {
        title: '菜单管理',
        auth: ['system.menu.view'],
      },
    },
    {
      path: 'permission',
      name: 'systemPermission',
      component: () => import('@/views/system/permission/index.vue'),
      meta: {
        title: '权限管理',
        auth: ['system.permission.view'],
      },
    },
  ],
}

export default routes
```

```ts
// apps/admin/src/router/routes.ts
import System from './modules/system'

const asyncRoutes: Route.recordMainRaw[] = [
  {
    meta: {
      title: '高歌体育',
      icon: 'solar:cup-star-outline',
    },
    children: [Gaoge],
  },
  {
    meta: {
      title: '系统管理',
      icon: 'ri:settings-3-line',
    },
    children: [System],
  },
  {
    meta: {
      title: '演示',
      icon: 'i-uim:box',
    },
    children: [
      MultilevelMenuExample,
      BreadcrumbExample,
      KeepAliveExample,
      TabExample,
      ComponentExample,
      IconExample,
      FeatureExample,
      PluginExample,
      PermissionExample,
      MockExample,
      JsxExample,
      ExternalLinkExample,
    ],
  },
]
```

```vue
<!-- apps/admin/src/views/system/role/index.vue -->
<route lang="yaml">
meta:
  title: 角色管理
</route>

<script setup lang="ts">
defineOptions({
  name: 'SystemRole',
})
</script>

<template>
  <FaPageMain>
    <FaPageHeader title="角色管理" content="首期只保留稳定路由入口，后续补齐真实能力。" />
  </FaPageMain>
</template>
```

```vue
<!-- apps/admin/src/views/system/menu/index.vue -->
<route lang="yaml">
meta:
  title: 菜单管理
</route>

<script setup lang="ts">
defineOptions({
  name: 'SystemMenu',
})
</script>

<template>
  <FaPageMain>
    <FaPageHeader title="菜单管理" content="首期只保留稳定路由入口，后续补齐真实能力。" />
  </FaPageMain>
</template>
```

```vue
<!-- apps/admin/src/views/system/permission/index.vue -->
<route lang="yaml">
meta:
  title: 权限管理
</route>

<script setup lang="ts">
defineOptions({
  name: 'SystemPermission',
})
</script>

<template>
  <FaPageMain>
    <FaPageHeader title="权限管理" content="首期只保留稳定路由入口，后续补齐真实能力。" />
  </FaPageMain>
</template>
```

- [ ] **Step 4: Re-run the route structure check**

Run: `pnpm --filter @gaoge/app-admin exec esno scripts/menu-route-structure.check.ts`
Expected: PASS

- [ ] **Step 5: Commit the system route skeleton**

```bash
git add apps/admin/src/router/modules/system/index.ts \
  apps/admin/src/router/routes.ts \
  apps/admin/src/views/system/role/index.vue \
  apps/admin/src/views/system/menu/index.vue \
  apps/admin/src/views/system/permission/index.vue \
  apps/admin/scripts/menu-route-structure.check.ts
git commit -m "feat: add system management routes"
```

### Task 4: Admin system user page and API client

**Files:**

- Create: `apps/admin/src/api/system/user/index.ts`
- Create: `apps/admin/src/views/system/user/auth.ts`
- Create: `apps/admin/src/views/system/user/model/defaults.ts`
- Create: `apps/admin/src/views/system/user/model/mapper.ts`
- Create: `apps/admin/src/views/system/user/model/types.ts`
- Create: `apps/admin/src/views/system/user/schemas/search.ts`
- Create: `apps/admin/src/views/system/user/schemas/table.ts`
- Create: `apps/admin/src/views/system/user/components/UserForm.vue`
- Create: `apps/admin/src/views/system/user/components/UserFormDialog.vue`
- Create: `apps/admin/src/views/system/user/components/ResetPasswordDialog.vue`
- Create: `apps/admin/src/views/system/user/index.vue`
- Test: `apps/admin/scripts/menu-route-structure.check.ts`

- [ ] **Step 1: Create the admin API client and permission constants**

```ts
// apps/admin/src/api/system/user/index.ts
import type {
  CreateSystemUserPayload,
  ResetSystemUserPasswordPayload,
  SystemUser,
  SystemUserListParams,
  SystemUserListResponse,
  UpdateSystemUserPayload,
  UpdateSystemUserStatusPayload,
} from '@gaoge/shared-types'

import api from '@/api'

export type {
  CreateSystemUserPayload,
  ResetSystemUserPasswordPayload,
  SystemUser,
  SystemUserListParams,
  SystemUserListResponse,
  UpdateSystemUserPayload,
  UpdateSystemUserStatusPayload,
}

export default {
  list: (params?: SystemUserListParams) =>
    api.get<SystemUserListResponse>('/system/users', { params }),
  create: (data: CreateSystemUserPayload) => api.post<SystemUser>('/system/users', data),
  update: (id: number, data: UpdateSystemUserPayload) =>
    api.patch<SystemUser>(`/system/users/${id}`, data),
  updateStatus: (id: number, data: UpdateSystemUserStatusPayload) =>
    api.patch<SystemUser>(`/system/users/${id}/status`, data),
  resetPassword: (id: number, data: ResetSystemUserPasswordPayload) =>
    api.patch<SystemUser>(`/system/users/${id}/reset-password`, data),
  remove: (id: number) => api.delete<SystemUser>(`/system/users/${id}`),
}
```

```ts
// apps/admin/src/views/system/user/auth.ts
export const SYSTEM_USER_PERMISSIONS = {
  create: 'system.user.create',
  update: 'system.user.update',
  enable: 'system.user.enable',
  disable: 'system.user.disable',
  resetPassword: 'system.user.reset-password',
  delete: 'system.user.delete',
} as const
```

- [ ] **Step 2: Add the page model, search schema, and table schema**

```ts
// apps/admin/src/views/system/user/model/types.ts
import type { UserRole, UserStatus } from '@gaoge/shared-types'

export interface SystemUserSearch {
  keyword: string
  role: '' | UserRole
  status: '' | UserStatus
}

export interface SystemUserFormModel {
  account: string
  password: string
  nickname: string
  avatarUrl: string
  role: UserRole
  status: UserStatus
}

export interface ResetPasswordFormModel {
  newPassword: string
}
```

```ts
// apps/admin/src/views/system/user/model/defaults.ts
import type { SystemUser } from '@/api/system/user'

import type { SystemUserFormModel, SystemUserSearch } from './types'

export const SYSTEM_USER_DEFAULT_SEARCH: SystemUserSearch = {
  keyword: '',
  role: '',
  status: '',
}

export function createEmptySystemUserForm(): SystemUserFormModel {
  return {
    account: '',
    password: '',
    nickname: '',
    avatarUrl: '',
    role: 'user',
    status: 'active',
  }
}

export function createSystemUserFormFromRow(user: SystemUser): SystemUserFormModel {
  return {
    account: user.account,
    password: '',
    nickname: user.nickname ?? '',
    avatarUrl: user.avatarUrl ?? '',
    role: user.role,
    status: user.status,
  }
}
```

```ts
// apps/admin/src/views/system/user/model/mapper.ts
import type {
  CreateSystemUserPayload,
  SystemUserListParams,
  UpdateSystemUserPayload,
} from '@gaoge/shared-types'

import type { SystemUserFormModel, SystemUserSearch } from './types'

export function buildSystemUserSearchParams(search: SystemUserSearch): SystemUserListParams {
  return {
    keyword: search.keyword.trim() || undefined,
    role: search.role || undefined,
    status: search.status || undefined,
  }
}

export function buildSystemUserCreatePayload(model: SystemUserFormModel): CreateSystemUserPayload {
  return {
    account: model.account.trim(),
    password: model.password,
    nickname: model.nickname.trim(),
    avatarUrl: model.avatarUrl.trim() || undefined,
    role: model.role,
    status: model.status,
  }
}

export function buildSystemUserUpdatePayload(model: SystemUserFormModel): UpdateSystemUserPayload {
  return {
    nickname: model.nickname.trim(),
    avatarUrl: model.avatarUrl.trim() || undefined,
    role: model.role,
  }
}
```

```ts
// apps/admin/src/views/system/user/schemas/search.ts
import type { SearchField } from '@/components/common/EsSearch/types'

export const SYSTEM_USER_ROLE_OPTIONS = [
  { label: '管理员', value: 'admin' },
  { label: '普通用户', value: 'user' },
]

export const SYSTEM_USER_STATUS_OPTIONS = [
  { label: '启用', value: 'active' },
  { label: '停用', value: 'inactive' },
]

export function createSystemUserSearchFields(): SearchField[] {
  return [
    {
      key: 'keyword',
      label: '关键词',
      type: 'input',
      placeholder: '账号 / 昵称',
    },
    {
      key: 'role',
      label: '角色',
      type: 'select',
      placeholder: '全部',
      options: SYSTEM_USER_ROLE_OPTIONS,
    },
    {
      key: 'status',
      label: '状态',
      type: 'select',
      placeholder: '全部',
      options: SYSTEM_USER_STATUS_OPTIONS,
    },
  ]
}
```

```ts
// apps/admin/src/views/system/user/schemas/table.ts
import dayjs from 'dayjs'

import type { TableColumn } from '@/components/common/EsTable/types'

import { SYSTEM_USER_PERMISSIONS } from '../auth'

export function formatDateTime(value: string | null) {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-'
}

export const SYSTEM_USER_TABLE_COLUMNS: TableColumn[] = [
  { label: '账号', prop: 'account', minWidth: 180 },
  { label: '昵称', prop: 'nickname', minWidth: 140 },
  { label: '角色', prop: 'role', width: 120 },
  { label: '状态', prop: 'status', width: 100, slot: 'status' },
  { label: '最近登录', prop: 'lastLoginAt', width: 170, slot: 'lastLoginAt' },
  { label: '创建时间', prop: 'createdAt', width: 170, slot: 'createdAt' },
  {
    label: '操作',
    prop: 'actions',
    width: 280,
    fixed: 'right',
    align: 'center',
    actions: [
      { key: 'edit', label: '编辑', auth: SYSTEM_USER_PERMISSIONS.update, type: 'primary' },
      { key: 'enable', label: '启用', auth: SYSTEM_USER_PERMISSIONS.enable, type: 'success' },
      { key: 'disable', label: '停用', auth: SYSTEM_USER_PERMISSIONS.disable, type: 'warning' },
      {
        key: 'resetPassword',
        label: '重置密码',
        auth: SYSTEM_USER_PERMISSIONS.resetPassword,
        type: 'primary',
      },
      { key: 'delete', label: '删除', auth: SYSTEM_USER_PERMISSIONS.delete, type: 'danger' },
    ],
  },
]
```

- [ ] **Step 3: Build the page, form dialog, and reset-password dialog**

```vue
<!-- apps/admin/src/views/system/user/components/UserForm.vue -->
<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'

import type { SystemUserFormModel } from '../model/types'
import { SYSTEM_USER_ROLE_OPTIONS, SYSTEM_USER_STATUS_OPTIONS } from '../schemas/search'

defineOptions({
  name: 'SystemUserForm',
})

const props = defineProps<{
  model: SystemUserFormModel
  mode: 'create' | 'edit'
}>()

const formRef = ref<FormInstance>()

const rules: FormRules<SystemUserFormModel> = {
  account: [{ required: true, message: '请输入登录账号', trigger: 'blur' }],
  password: [
    {
      required: props.mode === 'create',
      message: '请输入初始密码',
      trigger: 'blur',
    },
  ],
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
}

async function validate() {
  await formRef.value?.validate()
  return true
}

function reset() {
  formRef.value?.resetFields()
}

function clearValidate() {
  formRef.value?.clearValidate()
}

defineExpose({
  validate,
  reset,
  clearValidate,
})
</script>

<template>
  <ElForm ref="formRef" :model="model" :rules="rules" label-width="96px">
    <ElFormItem label="登录账号" prop="account">
      <ElInput v-model="model.account" :disabled="mode === 'edit'" placeholder="请输入登录账号" />
    </ElFormItem>
    <ElFormItem :label="mode === 'create' ? '初始密码' : '密码'" prop="password">
      <ElInput
        v-model="model.password"
        type="password"
        :placeholder="mode === 'create' ? '请输入初始密码' : '编辑时留空，密码走单独重置'"
        :disabled="mode === 'edit'"
      />
    </ElFormItem>
    <ElFormItem label="昵称" prop="nickname">
      <ElInput v-model="model.nickname" placeholder="请输入昵称" />
    </ElFormItem>
    <ElFormItem label="头像地址" prop="avatarUrl">
      <ElInput v-model="model.avatarUrl" placeholder="请输入头像 URL" />
    </ElFormItem>
    <ElFormItem label="角色" prop="role">
      <ElSelect v-model="model.role" class="w-full">
        <ElOption
          v-for="item in SYSTEM_USER_ROLE_OPTIONS"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </ElSelect>
    </ElFormItem>
    <ElFormItem label="状态" prop="status">
      <ElSelect v-model="model.status" class="w-full">
        <ElOption
          v-for="item in SYSTEM_USER_STATUS_OPTIONS"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </ElSelect>
    </ElFormItem>
  </ElForm>
</template>
```

```vue
<!-- apps/admin/src/views/system/user/index.vue -->
<route lang="yaml">
meta:
  title: 用户管理
</route>

<script setup lang="ts">
import { ElMessage, ElMessageBox, ElTag } from 'element-plus'

import type { SearchFormData } from '@/components/common/EsSearch/types'
import { useCrudDialog } from '@/composables/useCrudDialog'
import { useListPage } from '@/composables/useListPage'

import systemUserApi from '@/api/system/user'
import type { SystemUser } from '@/api/system/user'

import { SYSTEM_USER_PERMISSIONS } from './auth'
import ResetPasswordDialog from './components/ResetPasswordDialog.vue'
import UserFormDialog from './components/UserFormDialog.vue'
import { SYSTEM_USER_DEFAULT_SEARCH } from './model/defaults'
import {
  buildSystemUserCreatePayload,
  buildSystemUserSearchParams,
  buildSystemUserUpdatePayload,
} from './model/mapper'
import type { SystemUserSearch } from './model/types'
import { createSystemUserSearchFields } from './schemas/search'
import { formatDateTime, SYSTEM_USER_TABLE_COLUMNS } from './schemas/table'

defineOptions({
  name: 'SystemUser',
})

const submitLoading = ref(false)
const resetLoading = ref(false)
const selectionDataList = ref<SystemUser[]>([])
const resetPasswordVisible = ref(false)
const resetTarget = ref<SystemUser | null>(null)

const {
  search,
  tableData,
  total,
  loading,
  page,
  pageSize,
  fetchList,
  handleSearch,
  handlePaginationChange,
} = useListPage<SystemUserSearch, SystemUser, ReturnType<typeof buildSystemUserSearchParams>>({
  defaultSearch: SYSTEM_USER_DEFAULT_SEARCH,
  buildParams: buildSystemUserSearchParams,
  request: systemUserApi.list,
  normalizeSearch(formData: SearchFormData) {
    return {
      keyword: String(formData.keyword ?? ''),
      role: String(formData.role ?? '') as SystemUserSearch['role'],
      status: String(formData.status ?? '') as SystemUserSearch['status'],
    }
  },
})

const { dialogVisible, dialogMode, currentRow, openCreate, openEdit } = useCrudDialog<SystemUser>()

async function handleSubmit(payload: any) {
  submitLoading.value = true
  try {
    if (dialogMode.value === 'create') {
      await systemUserApi.create(buildSystemUserCreatePayload(payload))
      ElMessage.success('新增成功')
    } else if (currentRow.value) {
      await systemUserApi.update(currentRow.value.id, buildSystemUserUpdatePayload(payload))
      ElMessage.success('更新成功')
    }
    dialogVisible.value = false
    await fetchList()
  } finally {
    submitLoading.value = false
  }
}

async function handleAction(row: SystemUser, key: string) {
  if (key === 'edit') {
    openEdit(row)
    return
  }
  if (key === 'enable' || key === 'disable') {
    await systemUserApi.updateStatus(row.id, { status: key === 'enable' ? 'active' : 'inactive' })
    ElMessage.success(key === 'enable' ? '已启用' : '已停用')
    await fetchList()
    return
  }
  if (key === 'resetPassword') {
    resetTarget.value = row
    resetPasswordVisible.value = true
    return
  }
  if (key === 'delete') {
    await ElMessageBox.confirm(`确定删除账号 ${row.account} 吗？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
    await systemUserApi.remove(row.id)
    ElMessage.success('已删除')
    await fetchList()
  }
}

function handleSelectionChange(rows: SystemUser[]) {
  selectionDataList.value = rows
}

async function handleResetPasswordSubmit(payload: { newPassword: string }) {
  if (!resetTarget.value) {
    return
  }
  resetLoading.value = true
  try {
    await systemUserApi.resetPassword(resetTarget.value.id, payload)
    ElMessage.success('密码已重置')
    resetPasswordVisible.value = false
  } finally {
    resetLoading.value = false
  }
}

onMounted(() => {
  fetchList()
})
</script>

<template>
  <div class="absolute-container">
    <FaPageMain class="flex-1 overflow-auto" main-class="flex-1 flex flex-col overflow-auto">
      <EsSearch
        v-model="search"
        :fields="createSystemUserSearchFields()"
        :default-visible-count="3"
        @search="handleSearch"
      />

      <EsListToolbar :selected-count="selectionDataList.length">
        <template #actions>
          <ElButton
            v-auth="SYSTEM_USER_PERMISSIONS.create"
            type="primary"
            plain
            @click="openCreate()"
          >
            新增用户
          </ElButton>
        </template>
      </EsListToolbar>

      <div class="table-wrapper">
        <EsTable
          v-model:page="page"
          v-model:page-size="pageSize"
          :columns="SYSTEM_USER_TABLE_COLUMNS"
          :data="tableData"
          :total="total"
          :loading="loading"
          table-height="100%"
          @action-click="({ row, action }) => handleAction(row, action.key)"
          @pagination-change="handlePaginationChange"
          @selection-change="handleSelectionChange"
        >
          <template #status="{ row }">
            <ElTag :type="row.status === 'active' ? 'success' : 'info'">
              {{ row.status === 'active' ? '启用' : '停用' }}
            </ElTag>
          </template>
          <template #lastLoginAt="{ row }">{{ formatDateTime(row.lastLoginAt) }}</template>
          <template #createdAt="{ row }">{{ formatDateTime(row.createdAt) }}</template>
        </EsTable>
      </div>
    </FaPageMain>

    <UserFormDialog
      v-model="dialogVisible"
      :mode="dialogMode"
      :user="currentRow"
      :loading="submitLoading"
      @submit="handleSubmit"
    />

    <ResetPasswordDialog
      v-model="resetPasswordVisible"
      :loading="resetLoading"
      @submit="handleResetPasswordSubmit"
    />
  </div>
</template>
```

```vue
<!-- apps/admin/src/views/system/user/components/UserFormDialog.vue -->
<script setup lang="ts">
import type { SystemUser } from '@/api/system/user'

import { createEmptySystemUserForm, createSystemUserFormFromRow } from '../model/defaults'
import type { SystemUserFormModel } from '../model/types'

import UserForm from './UserForm.vue'

defineOptions({
  name: 'SystemUserFormDialog',
})

const props = defineProps<{
  modelValue: boolean
  mode: 'create' | 'edit'
  user?: SystemUser | null
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit', payload: SystemUserFormModel): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const formRef = ref<{
  validate: () => Promise<boolean>
  reset: () => void
  clearValidate: () => void
}>()
const formModel = ref<SystemUserFormModel>(createEmptySystemUserForm())

async function handleSubmit() {
  const valid = await formRef.value?.validate()
  if (!valid) {
    return
  }
  emit('submit', formModel.value)
}

watch(
  () => [props.modelValue, props.mode, props.user] as const,
  ([opened]) => {
    if (!opened) {
      return
    }
    formModel.value =
      props.mode === 'edit' && props.user
        ? createSystemUserFormFromRow(props.user)
        : createEmptySystemUserForm()
    nextTick(() => {
      formRef.value?.clearValidate()
    })
  },
  { immediate: true },
)
</script>

<template>
  <ElDialog v-model="visible" :title="mode === 'create' ? '新增用户' : '编辑用户'" width="640px">
    <UserForm ref="formRef" :model="formModel" :mode="mode" />
    <template #footer>
      <ElButton @click="visible = false">取消</ElButton>
      <ElButton type="primary" :loading="loading" @click="handleSubmit">保存</ElButton>
    </template>
  </ElDialog>
</template>
```

```vue
<!-- apps/admin/src/views/system/user/components/ResetPasswordDialog.vue -->
<script setup lang="ts">
defineOptions({
  name: 'SystemUserResetPasswordDialog',
})

const props = defineProps<{
  modelValue: boolean
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit', payload: { newPassword: string }): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const form = reactive({
  newPassword: '',
})

function handleSubmit() {
  emit('submit', { newPassword: form.newPassword })
}
</script>

<template>
  <ElDialog v-model="visible" title="重置密码" width="480px">
    <ElForm label-width="84px">
      <ElFormItem label="新密码">
        <ElInput v-model="form.newPassword" type="password" placeholder="请输入 6 到 18 位新密码" />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="visible = false">取消</ElButton>
      <ElButton type="primary" :loading="loading" @click="handleSubmit">确认重置</ElButton>
    </template>
  </ElDialog>
</template>
```

- [ ] **Step 4: Run admin verification**

Run: `pnpm --filter @gaoge/app-admin typecheck`
Expected: PASS

Run: `pnpm --filter @gaoge/app-admin exec esno scripts/menu-route-structure.check.ts`
Expected: PASS

- [ ] **Step 5: Commit the admin system user slice**

```bash
git add apps/admin/src/api/system/user/index.ts \
  apps/admin/src/views/system/user \
  apps/admin/src/router/modules/system/index.ts \
  apps/admin/src/router/routes.ts
git commit -m "feat: add system user admin page"
```

### Task 5: Final verification and cleanup

**Files:**

- Modify: `apps/api/src/modules/auth/services/auth.service.ts`
- Modify: `apps/api/src/modules/system/user/system-user.service.ts`
- Modify: `apps/admin/src/views/system/user/index.vue`
- Modify: `apps/admin/src/router/modules/system/index.ts`
- Test: `apps/api/src/modules/auth/services/auth.service.spec.ts`
- Test: `apps/api/src/modules/system/user/system-user.service.spec.ts`
- Test: `apps/admin/scripts/menu-route-structure.check.ts`

- [ ] **Step 1: Re-run focused backend tests**

Run: `pnpm --filter @gaoge/app-api test -- auth.service.spec.ts --runInBand`
Expected: PASS

Run: `pnpm --filter @gaoge/app-api test -- system-user.service.spec.ts --runInBand`
Expected: PASS

- [ ] **Step 2: Re-run admin type checking**

Run: `pnpm --filter @gaoge/app-admin typecheck`
Expected: PASS

- [ ] **Step 3: Re-run the route structure check**

Run: `pnpm --filter @gaoge/app-admin exec esno scripts/menu-route-structure.check.ts`
Expected: PASS

- [ ] **Step 4: Run repository-level validation**

Run: `pnpm lint`
Expected: PASS with no prettier/eslint/stylelint failures

Run: `pnpm typecheck`
Expected: PASS for `@gaoge/app-admin`, `@gaoge/app-api`, and unaffected workspaces

- [ ] **Step 5: Commit the verified first phase**

```bash
git add apps/admin/src/api/system/user/index.ts \
  apps/admin/src/router/modules/system/index.ts \
  apps/admin/src/router/routes.ts \
  apps/admin/src/views/system \
  apps/admin/scripts/menu-route-structure.check.ts \
  apps/api/src/app.module.ts \
  apps/api/src/modules/auth/services/auth.service.ts \
  apps/api/src/modules/auth/services/auth.service.spec.ts \
  apps/api/src/modules/system \
  packages/shared/types/src/index.ts \
  packages/shared/types/src/system-user.ts
git commit -m "feat: add system management first phase"
```
