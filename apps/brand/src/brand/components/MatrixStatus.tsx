export type MatrixStatusValue = 'live' | 'building' | 'planned'

const labels = {
  content: {
    building: '建设中',
    live: '运营中',
    planned: '规划中',
  },
  digital: {
    building: '演示系统',
    live: '演示系统',
    planned: '规划中',
  },
} as const

interface MatrixStatusProps {
  readonly context: 'content' | 'digital'
  readonly status: MatrixStatusValue
}

export default function MatrixStatus({ context, status }: MatrixStatusProps) {
  const toneClassName =
    context === 'digital' ? 'border-white/10 text-white/45' : 'border-current/25'

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs tracking-[0.08em] ${toneClassName}`}
      data-status={status}
    >
      {labels[context][status]}
    </span>
  )
}
