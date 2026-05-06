import { Injectable } from '@nestjs/common'

import { PrismaService } from '@/common/prisma/prisma.service'

export interface HealthStatus {
  status: 'ok'
}

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  checkApp(): HealthStatus {
    return { status: 'ok' }
  }

  async checkDatabase(): Promise<HealthStatus> {
    await this.prisma.$queryRaw`SELECT 1`
    return { status: 'ok' }
  }
}
