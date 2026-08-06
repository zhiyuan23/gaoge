import type { GroupLeader } from '@/pages/group/types'

import DefaultAvatar from './DefaultAvatar'

interface LeadershipStructureProps {
  readonly leaders: readonly GroupLeader[]
}

function LeaderCard({
  leader,
  featured = false,
  subdued = false,
}: {
  readonly featured?: boolean
  readonly leader: GroupLeader
  readonly subdued?: boolean
}) {
  return (
    <article
      className={`group-leader-card flex rounded-[24px] border ${
        featured
          ? 'min-h-28 items-center gap-4 border-white/10 bg-[rgb(var(--brand-accent)/0.1)] p-5 text-left'
          : 'min-h-28 flex-col items-center justify-center gap-3 border-white/10 p-2 text-center md:min-h-32 md:flex-row md:justify-start md:gap-4 md:p-5 md:text-left'
      } ${subdued ? 'group-leader-card--subdued' : ''}`}
      data-team-emphasis={subdued ? 'subdued' : 'standard'}
      data-testid="group-leader"
    >
      <DefaultAvatar size={featured ? 'standard' : 'compact'} />
      <div className="min-w-0">
        <h3
          className={`font-medium tracking-[-0.04em] text-white ${
            featured ? 'text-2xl md:text-3xl' : 'text-base md:text-xl'
          }`}
        >
          {leader.nickname}
        </h3>
        <p className="mt-1 text-[10px] leading-4 text-[rgb(var(--brand-muted))] md:mt-2 md:text-sm md:leading-6">
          {leader.role}
        </p>
      </div>
    </article>
  )
}

export default function LeadershipStructure({ leaders }: LeadershipStructureProps) {
  if (!leaders.length) {
    return (
      <section className="mx-auto max-w-7xl px-6 py-24 md:px-10 md:py-32">
        <h2 className="text-4xl font-medium tracking-[-0.06em] text-white md:text-6xl">管理团队</h2>
        <p className="mt-6 text-sm text-[rgb(var(--brand-muted))]">团队信息整理中</p>
      </section>
    )
  }

  const groupLeader = leaders.find(({ scope }) => scope === 'group')
  const industryLeaders = leaders.filter(({ scope }) =>
    ['digital', 'content', 'sports'].includes(scope),
  )
  const sportsLeaders = leaders.filter(({ scope }) => ['club', 'league'].includes(scope))

  return (
    <section
      aria-labelledby="leadership-title"
      className="mx-auto max-w-7xl px-6 py-24 md:px-10 md:py-32"
    >
      <h2
        className="text-4xl font-medium tracking-[-0.06em] text-white md:text-6xl"
        id="leadership-title"
      >
        管理团队
      </h2>
      <p className="mt-5 max-w-lg text-sm leading-7 text-[rgb(var(--brand-muted))] md:text-base">
        从集团方向到业务现场，每一项事业都有清晰的责任连接。
      </p>

      <div className="mt-10 grid gap-3 lg:grid-cols-[0.86fr_1.14fr]">
        {groupLeader ? <LeaderCard featured leader={groupLeader} /> : null}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {industryLeaders.map((leader) => (
            <LeaderCard key={leader.id} leader={leader} />
          ))}
        </div>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2 sm:mt-3 sm:gap-3 md:ml-[43%]">
        {sportsLeaders.map((leader) => (
          <LeaderCard key={leader.id} leader={leader} subdued />
        ))}
      </div>
    </section>
  )
}
