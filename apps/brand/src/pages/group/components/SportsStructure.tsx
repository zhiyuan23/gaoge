import GroupModuleLink from '@/pages/group/components/GroupModuleLink'
import type { SportsEntity } from '@/pages/group/types'

interface SportsStructureProps {
  readonly entities: readonly SportsEntity[]
}

export default function SportsStructure({ entities }: SportsStructureProps) {
  return (
    <section
      aria-labelledby="sports-structure-title"
      className="group-page-section mx-auto max-w-[1440px] scroll-mt-32 px-6 py-16 md:px-10 md:py-24"
      id="group-sports"
    >
      <div>
        <p className="text-sm text-[rgb(var(--brand-accent))]">因热爱相聚</p>
        <div className="mt-4 flex items-center justify-between gap-6">
          <h2
            className="font-display-cn shrink-0 text-4xl font-medium tracking-[-0.025em] text-white md:text-6xl"
            id="sports-structure-title"
          >
            高歌体育
          </h2>
          <GroupModuleLink
            href="https://sports.gaoge.cc"
            label="进入高歌体育"
            shortLabel="进入体育"
          />
        </div>
        <p className="mt-5 max-w-lg text-sm leading-7 text-[rgb(var(--brand-muted))] md:text-base">
          将体育浪漫主义坚决贯彻到底。
        </p>
      </div>

      <div className="mt-10 grid gap-4 md:mt-12 md:grid-cols-[0.88fr_1.12fr]">
        {entities.map((entity) => (
          <article
            className={`group-sports-entity flex flex-col justify-between rounded-[24px] border border-white/10 p-6 transition-[border-color,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-1 hover:border-white/25 active:translate-y-0 active:scale-[0.985] md:p-7 ${
              entity.id === 'league'
                ? 'group-sports-entity--league min-h-60 md:min-h-72'
                : 'min-h-52 md:mt-8 md:min-h-60'
            }`}
            data-testid="group-sports-entity"
            key={entity.id}
          >
            <span
              aria-hidden="true"
              className="text-6xl font-light tracking-[-0.08em] text-white/[0.08] md:text-8xl"
            >
              {entity.id === 'club' ? 'FC' : 'GSL'}
            </span>
            <div>
              <h3 className="text-3xl font-medium tracking-[-0.05em] text-white md:text-4xl">
                {entity.name}
              </h3>
              <p className="mt-3 text-sm text-[rgb(var(--brand-muted))]">{entity.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
