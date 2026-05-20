import { Module } from '@nestjs/common'

import { PrismaModule } from '@/common/prisma/prisma.module'

import { RbacSyncService } from './rbac-sync.service'

@Module({
  imports: [PrismaModule],
  providers: [RbacSyncService],
  exports: [RbacSyncService],
})
export class RbacModule {}
