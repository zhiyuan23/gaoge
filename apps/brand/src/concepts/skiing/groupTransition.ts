export type GroupGestureKind = 'desktop' | 'mobile'

export interface GroupGestureProfile {
  readonly dragCommitRatio: number
  readonly flickMinDistanceRatio: number
  readonly flickProjectionRatio: number
  readonly gestureThreshold: number
  readonly minFlingVelocity: number
}

const GROUP_GESTURE_PROFILES: Record<GroupGestureKind, GroupGestureProfile> = {
  desktop: {
    dragCommitRatio: 0.28,
    flickMinDistanceRatio: 0.08,
    flickProjectionRatio: 0.16,
    gestureThreshold: 10,
    minFlingVelocity: 900,
  },
  mobile: {
    dragCommitRatio: 0.18,
    flickMinDistanceRatio: 0.05,
    flickProjectionRatio: 0.16,
    gestureThreshold: 8,
    minFlingVelocity: 650,
  },
}

interface GroupTransitionIntent {
  readonly distance: number
  readonly velocity: number
  readonly viewportHeight: number
}

export interface PointerSample {
  readonly position: number
  readonly timestamp: number
}

export function rubberband(distance: number, dimension: number, constant = 0.55) {
  return (distance * dimension * constant) / (dimension + constant * Math.abs(distance))
}

export function projectTravel(distance: number, velocity: number, decelerationRate = 0.99) {
  return distance + (velocity / 1000) * (decelerationRate / (1 - decelerationRate))
}

export function getGroupGestureProfile(kind: GroupGestureKind) {
  return GROUP_GESTURE_PROFILES[kind]
}

export function shouldEnterGroup(
  { distance, velocity, viewportHeight }: GroupTransitionIntent,
  profile = getGroupGestureProfile('desktop'),
) {
  if (distance >= viewportHeight * profile.dragCommitRatio) return true

  return (
    distance >= viewportHeight * profile.flickMinDistanceRatio &&
    velocity >= profile.minFlingVelocity &&
    projectTravel(distance, velocity) >= viewportHeight * profile.flickProjectionRatio
  )
}

export function getWheelCommitDistance(viewportHeight: number) {
  return Math.min(180, viewportHeight * 0.2)
}

export function getUpwardVelocity(samples: readonly PointerSample[]) {
  if (samples.length < 2) return 0

  const latest = samples.at(-1)
  const previous = samples.find((sample) => latest && latest.timestamp - sample.timestamp <= 80)

  if (!latest || !previous || latest.timestamp === previous.timestamp) return 0

  return (previous.position - latest.position) / ((latest.timestamp - previous.timestamp) / 1000)
}

export function normalizeWheelDelta(deltaY: number, deltaMode: number, viewportHeight: number) {
  if (deltaMode === 1) return deltaY * 16
  if (deltaMode === 2) return deltaY * viewportHeight
  return deltaY
}
