import type { MiniEventSeriesDto } from './event-series.dto'
import type { MiniReportDto } from './report.dto'
import type { MiniScheduleDto } from './schedule.dto'
import type { MiniStandingRowDto } from './standing.dto'
import type { MiniTeamDto } from './team.dto'

export interface MiniHomeDto {
  eventSeries: MiniEventSeriesDto
  nextSchedules: MiniScheduleDto[]
  teams: MiniTeamDto[]
  standingsPreview: MiniStandingRowDto[]
  latestReports: MiniReportDto[]
}
