import { ArrowUpRight } from 'lucide-react'

import type { SportsEntity } from '@/pages/group/types'

interface SportsStructureProps {
  readonly entities: readonly SportsEntity[]
}

export default function SportsStructure({ entities }: SportsStructureProps) {
  return (
    <section
      aria-labelledby="sports-structure-title"
      className="mx-auto max-w-7xl px-6 py-16 md:px-10 md:py-24"
    >
      <div className="max-w-2xl">
        <p className="mb-4 text-sm text-[rgb(var(--brand-accent))]">因热爱相聚</p>
        <h2
          className="text-4xl font-medium tracking-[-0.06em] text-white md:text-6xl"
          id="sports-structure-title"
        >
          高歌体育
        </h2>
        <p className="mt-5 max-w-lg text-sm leading-7 text-[rgb(var(--brand-muted))] md:text-base">
          将体育浪漫主义坚决贯彻到底。
        </p>
      </div>

      <div className="mt-10 grid gap-4 md:mt-12 md:grid-cols-[0.88fr_1.12fr]">
        {entities.map((entity) => (
          <a
            aria-label={`${entity.name}，进入高歌体育，将在新窗口打开`}
            className={`group-sports-entity group flex flex-col justify-between rounded-[24px] border border-white/10 p-6 transition-[border-color,transform] duration-300 hover:-translate-y-1 hover:border-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[rgb(var(--brand-accent))] active:translate-y-0 md:p-7 ${
              entity.id === 'league'
                ? 'group-sports-entity--league min-h-60 md:min-h-72'
                : 'min-h-52 md:mt-8 md:min-h-60'
            }`}
            href="https://sports.gaoge.cc"
            key={entity.id}
            rel="noopener noreferrer"
            target="_blank"
          >
            <div className="flex items-start justify-between gap-4">
              <span
                aria-hidden="true"
                className="text-6xl font-light tracking-[-0.08em] text-white/[0.08] md:text-8xl"
              >
                {entity.id === 'club' ? 'FC' : 'GSL'}
              </span>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 text-white/45 transition-colors group-hover:border-white/20 group-hover:bg-white/[0.06] group-hover:text-white">
                <ArrowUpRight aria-hidden="true" size={16} strokeWidth={1.5} />
              </span>
            </div>
            <div>
              <h3 className="text-3xl font-medium tracking-[-0.05em] text-white md:text-4xl">
                {entity.name}
              </h3>
              <p className="mt-3 text-sm text-[rgb(var(--brand-muted))]">{entity.description}</p>
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}
