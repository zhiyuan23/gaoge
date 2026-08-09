import { describe, expect, it } from 'vitest'

import {
  getGroupGestureProfile,
  getUpwardVelocity,
  getWheelCommitDistance,
  normalizeWheelDelta,
  projectTravel,
  rubberband,
  shouldEnterGroup,
} from '@/concepts/skiing/groupTransition'

describe('group transition physics', () => {
  it('keeps the existing desktop gesture behavior', () => {
    const profile = getGroupGestureProfile('desktop')

    expect(shouldEnterGroup({ distance: 237, velocity: 0, viewportHeight: 844 }, profile)).toBe(
      true,
    )
    expect(shouldEnterGroup({ distance: 120, velocity: 0, viewportHeight: 844 }, profile)).toBe(
      false,
    )
  })

  it('uses more responsive mobile distance and flick gates without accepting a slow short drag', () => {
    const profile = getGroupGestureProfile('mobile')

    expect(shouldEnterGroup({ distance: 152, velocity: 0, viewportHeight: 844 }, profile)).toBe(
      true,
    )
    expect(shouldEnterGroup({ distance: 80, velocity: 650, viewportHeight: 844 }, profile)).toBe(
      true,
    )
    expect(shouldEnterGroup({ distance: 80, velocity: 0, viewportHeight: 844 }, profile)).toBe(
      false,
    )
  })

  it('keeps projection as a required flick signal on both profiles', () => {
    expect(shouldEnterGroup({ distance: 90, velocity: 1_200, viewportHeight: 844 })).toBe(true)
    expect(shouldEnterGroup({ distance: 20, velocity: 1_200, viewportHeight: 844 })).toBe(false)
  })

  it('projects momentum and resists downward overscroll', () => {
    expect(projectTravel(80, 1_000)).toBeGreaterThan(80)
    expect(rubberband(120, 844)).toBeGreaterThan(0)
    expect(rubberband(120, 844)).toBeLessThan(120)
  })

  it('requires accumulated wheel intent', () => {
    expect(getWheelCommitDistance(844)).toBeGreaterThan(100)
    expect(getWheelCommitDistance(844)).toBeLessThanOrEqual(180)
  })

  it('does not reuse stale movement as release velocity', () => {
    expect(
      getUpwardVelocity([
        { position: 700, timestamp: 0 },
        { position: 620, timestamp: 40 },
        { position: 620, timestamp: 400 },
      ]),
    ).toBe(0)
    expect(
      getUpwardVelocity([
        { position: 700, timestamp: 0 },
        { position: 620, timestamp: 40 },
        { position: 580, timestamp: 60 },
      ]),
    ).toBe(2_000)
  })

  it('normalizes line and page wheel deltas to pixels', () => {
    expect(normalizeWheelDelta(3, WheelEvent.DOM_DELTA_PIXEL, 800)).toBe(3)
    expect(normalizeWheelDelta(3, WheelEvent.DOM_DELTA_LINE, 800)).toBe(48)
    expect(normalizeWheelDelta(1, WheelEvent.DOM_DELTA_PAGE, 800)).toBe(800)
  })
})
