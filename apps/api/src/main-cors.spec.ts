import { isAllowedCorsOrigin } from './main-cors'

describe('isAllowedCorsOrigin', () => {
  it('allows local admin dev ports selected by Vite', () => {
    expect(isAllowedCorsOrigin('http://localhost:9000')).toBe(true)
    expect(isAllowedCorsOrigin('http://localhost:9001')).toBe(true)
    expect(isAllowedCorsOrigin('http://127.0.0.1:9001')).toBe(true)
  })

  it('keeps known production origins allowed without opening arbitrary origins', () => {
    expect(isAllowedCorsOrigin('https://admin.gaoge.cc')).toBe(true)
    expect(isAllowedCorsOrigin('https://evil.example.com')).toBe(false)
  })
})
