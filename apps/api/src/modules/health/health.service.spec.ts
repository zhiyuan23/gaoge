import { HealthService } from './health.service'

describe('healthService', () => {
  it('returns this api identity in app health status', () => {
    const service = new HealthService({} as never)

    expect(service.checkApp()).toEqual({
      app: '@gaoge/app-api',
      status: 'ok',
    })
  })
})
