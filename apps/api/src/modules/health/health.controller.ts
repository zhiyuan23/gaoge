import { Controller, Get } from '@nestjs/common'

import { HealthService } from './health.service'

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  checkApp() {
    return this.healthService.checkApp()
  }

  @Get('db')
  checkDatabase() {
    return this.healthService.checkDatabase()
  }
}
