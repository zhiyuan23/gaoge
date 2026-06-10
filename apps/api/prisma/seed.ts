#!/usr/bin/env ts-node
/**
 * 种子数据脚本 - 用于初始化测试数据
 *
 * 使用方法:
 * pnpm ts-node prisma/seed.ts
 */

import { PrismaClient } from '@prisma/client'

import { hashPassword } from '../src/common/auth/password.util'
import { RbacSyncService } from '../src/modules/system/rbac/rbac-sync.service'

import { seedPlayers, shouldResetPlayers } from './seed-player-data'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 开始播种数据...')

  const rbacSyncService = new RbacSyncService(prisma as any)
  const rbacResult = await rbacSyncService.syncBuiltIns()
  console.log(
    `🔐 已同步 RBAC 内置数据：roles=${rbacResult.roles}, permissions=${rbacResult.permissions}, menus=${rbacResult.menus}`,
  )

  const adminAccount = process.env.ADMIN_ACCOUNT
  const adminPassword = process.env.ADMIN_PASSWORD

  if (adminAccount && adminPassword) {
    const adminUser = await prisma.user.upsert({
      where: { account: adminAccount },
      update: {
        passwordHash: await hashPassword(adminPassword),
        role: 'admin',
        status: 'active',
        nickname: '系统管理员',
      },
      create: {
        account: adminAccount,
        passwordHash: await hashPassword(adminPassword),
        role: 'admin',
        status: 'active',
        nickname: '系统管理员',
      },
    })
    const superAdminRole = await prisma.role.findUnique({
      where: { code: 'super_admin' },
    })
    if (superAdminRole) {
      await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: adminUser.id,
            roleId: superAdminRole.id,
          },
        },
        update: {},
        create: {
          userId: adminUser.id,
          roleId: superAdminRole.id,
        },
      })
    }
    console.log(`👤 已初始化管理员账号：${adminAccount}`)
  } else {
    console.log('⚠️  未提供 ADMIN_ACCOUNT / ADMIN_PASSWORD，跳过管理员账号初始化')
  }

  if (shouldResetPlayers(seedPlayers)) {
    await prisma.player.deleteMany({})
    console.log('🗑️  已清空现有球员数据')

    for (const playerData of seedPlayers) {
      const player = await prisma.player.create({
        data: playerData,
      })
      console.log(`✅ 创建球员：${player.nickname}`)
    }
  } else {
    console.log('⚠️  未配置球员 seed 数据，跳过球员数据重置')
  }

  const count = await prisma.player.count()
  console.log(`\n✨ 完成！共创建 ${count} 名球员`)
}

main()
  .catch((e) => {
    console.error('❌ 错误:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
