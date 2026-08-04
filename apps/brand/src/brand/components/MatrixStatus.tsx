export type MatrixStatusValue = 'live' | 'building' | 'planned'

const labels = {
  content: {
    building: '建设中',
    live: '运营中',
    planned: '规划中',
  },
  digital: {
    building: '建设中',
    live: '运行中',
    planned: '规划中',
  },
} as const

interface MatrixStatusProps {
  readonly context: 'content' | 'digital'
  readonly status: MatrixStatusValue
}

export default function MatrixStatus({ context, status }: MatrixStatusProps) {
  return (
    <span
      className="border-current/25 inline-flex rounded-full border px-3 py-1 text-xs tracking-[0.08em]"
      data-status={status}
    >
      {labels[context][status]}
    </span>
  )
}
