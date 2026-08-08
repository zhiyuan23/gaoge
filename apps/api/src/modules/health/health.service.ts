import { Injectable } from '@nestjs/common'

import { PrismaService } from '@/common/prisma/prisma.service'

export interface HealthStatus {
  app?: '@gaoge/core-api'
  status: 'ok'
}

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  checkApp(): HealthStatus {
    return { app: '@gaoge/core-api', status: 'ok' }
  }

  async checkDatabase(): Promise<HealthStatus> {
    await this.prisma.$queryRaw`SELECT 1`
    return { status: 'ok' }
  }
}
