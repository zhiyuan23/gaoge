import type { GroupLeader } from '@/pages/group/types'

import DefaultAvatar from './DefaultAvatar'

interface LeadershipStructureProps {
  readonly leaders: readonly GroupLeader[]
}

function LeaderCard({ leader }: { readonly leader: GroupLeader }) {
  return (
    <article
      className="group-leader-card flex min-h-28 items-center gap-4 rounded-[24px] border border-white/10 p-5 text-left md:min-h-32"
      data-testid="group-leader"
    >
      <DefaultAvatar label={leader.nickname} marker="G" variant="leader" />
      <div className="min-w-0">
        <h3 className="text-xl font-medium tracking-[-0.04em] text-white md:text-2xl">
          {leader.nickname}
        </h3>
        <p className="mt-2 text-sm leading-6 text-[rgb(var(--brand-muted))]">{leader.role}</p>
      </div>
    </article>
  )
}

export default function LeadershipStructure({ leaders }: LeadershipStructureProps) {
  if (!leaders.length) {
    return (
      <section
        className="group-page-section mx-auto max-w-[1440px] scroll-mt-32 px-6 py-16 md:px-10 md:py-24"
        id="group-leadership"
      >
        <h2 className="font-display-cn text-4xl font-medium tracking-[-0.025em] text-white md:text-6xl">
          集团管理层
        </h2>
        <p className="mt-6 text-sm text-[rgb(var(--brand-muted))]">团队信息整理中</p>
      </section>
    )
  }

  return (
    <section
      aria-labelledby="leadership-title"
      className="group-page-section mx-auto max-w-[1440px] scroll-mt-32 px-6 py-16 md:px-10 md:py-24"
      id="group-leadership"
    >
      <h2
        className="font-display-cn text-4xl font-medium tracking-[-0.025em] text-white md:text-6xl"
        id="leadership-title"
      >
        集团管理层
      </h2>
      <p className="mt-5 max-w-lg text-sm leading-7 text-[rgb(var(--brand-muted))] md:text-base">
        从集团方向到球队与联赛，我们一起让热爱持续向前。
      </p>

      <div className="mt-10 grid gap-3 md:grid-cols-3">
        {leaders.map((leader) => (
          <LeaderCard key={leader.id} leader={leader} />
        ))}
      </div>
    </section>
  )
}
