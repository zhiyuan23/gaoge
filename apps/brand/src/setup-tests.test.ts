import { describe, expect, it } from 'vitest'

describe('browser test environment', () => {
  it('provides matchMedia during the first test', () => {
    expect(window.matchMedia('(prefers-reduced-motion)').matches).toBe(false)
  })

  it('provides a fresh matchMedia implementation for every test', () => {
    expect(window.matchMedia('(prefers-reduced-motion)').matches).toBe(false)
  })
})
