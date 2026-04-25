import type { TestingModule } from '@nestjs/testing'
import { Test } from '@nestjs/testing'

import { HealthController } from './health.controller'
import { HealthService } from './health.service'

describe('healthController', () => {
  let controller: HealthController
  let service: jest.Mocked<HealthService>

  beforeEach(async () => {
    service = {
      checkApp: jest.fn(),
      checkDatabase: jest.fn(),
    } as unknown as jest.Mocked<HealthService>

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: service,
        },
      ],
    }).compile()

    controller = module.get(HealthController)
  })

  it('returns process health status', () => {
    service.checkApp.mockReturnValue({ status: 'ok' })

    expect(controller.checkApp()).toEqual({ status: 'ok' })
  })

  it('returns database health status', async () => {
    service.checkDatabase.mockResolvedValue({ status: 'ok' })

    await expect(controller.checkDatabase()).resolves.toEqual({ status: 'ok' })
  })
})
