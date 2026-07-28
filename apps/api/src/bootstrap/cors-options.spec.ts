import { createCorsOptions, isAllowedCorsOrigin } from './cors-options'

describe('cors-options', () => {
  it('allows auto-incremented local admin dev server ports outside production', () => {
    expect(isAllowedCorsOrigin('http://localhost:9002', { NODE_ENV: 'development' })).toBe(true)
    expect(isAllowedCorsOrigin('http://127.0.0.1:9003', { NODE_ENV: 'development' })).toBe(true)
  })

  it('does not allow local dev server ports in production', () => {
    expect(isAllowedCorsOrigin('http://localhost:9002', { NODE_ENV: 'production' })).toBe(false)
  })

  it('keeps production origins allowed', () => {
    expect(isAllowedCorsOrigin('https://admin.gaoge.cc', { NODE_ENV: 'production' })).toBe(true)
    expect(isAllowedCorsOrigin('https://sports.gaoge.cc', { NODE_ENV: 'production' })).toBe(true)
    expect(isAllowedCorsOrigin('https://gaoge.cc', { NODE_ENV: 'production' })).toBe(true)
    expect(isAllowedCorsOrigin('https://www.gaoge.cc', { NODE_ENV: 'production' })).toBe(true)
  })

  it('reflects allowed origins for credentialed CORS requests', () => {
    const corsOptions = createCorsOptions({ NODE_ENV: 'development' })
    const callback = jest.fn()

    corsOptions.origin?.('http://localhost:9002', callback)

    expect(callback).toHaveBeenCalledWith(null, true)
  })
})
