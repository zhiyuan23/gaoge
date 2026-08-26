import { Module } from '@nestjs/common'

import { PrismaModule } from '@/common/prisma/prisma.module'

import { PermissionResolverService } from './permission-resolver.service'
import { RbacSyncService } from './rbac-sync.service'

@Module({
  imports: [PrismaModule],
  providers: [PermissionResolverService, RbacSyncService],
  exports: [PermissionResolverService, RbacSyncService],
})
export class RbacModule {}
