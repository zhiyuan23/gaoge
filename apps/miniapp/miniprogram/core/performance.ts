export interface PerformanceMark {
  name: string
  startedAt: number
}

export function startPerformanceMark(name: string): PerformanceMark {
  return {
    name,
    startedAt: Date.now(),
  }
}

export function endPerformanceMark(mark: PerformanceMark) {
  return {
    name: mark.name,
    duration: Date.now() - mark.startedAt,
  }
}
