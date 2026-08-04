import { describe, expect, it } from 'vitest'

import {
  marqueeRowOne,
  marqueeRowTwo,
  marqueeTracks,
  projects,
  services,
} from '@/concepts/creator/data'

describe('Jack 3D creator data', () => {
  it('preserves the supplied marquee source counts and tripled tracks', () => {
    expect(marqueeRowOne).toHaveLength(11)
    expect(marqueeRowTwo).toHaveLength(10)
    expect(marqueeTracks.rowOne).toHaveLength(33)
    expect(marqueeTracks.rowTwo).toHaveLength(30)
  })

  it('preserves the supplied service and project counts', () => {
    expect(services).toHaveLength(5)
    expect(projects).toHaveLength(3)

    projects.forEach((project) => {
      expect(project.images).toHaveLength(3)
      project.images.forEach((image) => expect(image).toMatch(/^https:\/\//))
    })
  })
})
