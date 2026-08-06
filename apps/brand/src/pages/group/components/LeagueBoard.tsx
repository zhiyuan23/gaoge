import type { LeagueDirector } from '@/pages/group/types'

import DefaultAvatar from './DefaultAvatar'

interface LeagueBoardProps {
  readonly directors: readonly LeagueDirector[]
}

export default function LeagueBoard({ directors }: LeagueBoardProps) {
  if (directors.length !== 20) {
    throw new Error(`LeagueBoard requires 20 directors, received ${directors.length}`)
  }

  return (
    <section
      aria-labelledby="league-board-title"
      className="mx-auto max-w-7xl px-6 py-24 md:px-10 md:py-32"
    >
      <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-end">
        <div>
          <h2
            className="text-4xl font-medium tracking-[-0.06em] text-white md:text-6xl"
            id="league-board-title"
          >
            联赛董事会
          </h2>
          <p className="mt-5 max-w-sm text-sm leading-7 text-[rgb(var(--brand-muted))] md:text-base">
            20名成员共同参与高歌超级联赛的长期建设。
          </p>
        </div>
        <p className="text-7xl font-light tracking-[-0.08em] text-[rgb(var(--brand-accent))] lg:text-right lg:text-9xl">
          20<span className="ml-3 text-sm tracking-normal text-[rgb(var(--brand-muted))]">席</span>
        </p>
      </div>

      <ol className="mt-12 grid grid-cols-4 gap-2 sm:gap-3 lg:grid-cols-5 xl:grid-cols-10">
        {directors.map((director) => (
          <li
            className="group-director-seat flex min-h-28 min-w-0 flex-col items-center justify-center gap-3 rounded-[16px] border border-white/10 p-2 text-center sm:rounded-[20px] sm:p-3"
            data-seat={director.seat}
            data-testid="league-director"
            key={director.id}
          >
            <DefaultAvatar size="compact" variant="placeholder" />
            <span className="max-w-full break-all text-xs font-medium leading-4 tracking-[-0.02em] text-white/85 md:text-sm">
              {director.nickname}
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}
