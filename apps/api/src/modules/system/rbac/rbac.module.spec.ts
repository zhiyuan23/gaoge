import { Test } from '@nestjs/testing'

import { PrismaService } from '@/common/prisma/prisma.service'

import { RbacModule } from './rbac.module'
import { RbacSyncService } from './rbac-sync.service'

describe('RbacModule', () => {
  it('provides RbacSyncService with an injectable PrismaService dependency', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [RbacModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile()

    expect(moduleRef.get(RbacSyncService)).toBeInstanceOf(RbacSyncService)
  })
})
