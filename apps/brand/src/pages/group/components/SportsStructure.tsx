import type { SportsEntity } from '@/pages/group/types'

interface SportsStructureProps {
  readonly entities: readonly SportsEntity[]
}

export default function SportsStructure({ entities }: SportsStructureProps) {
  return (
    <section
      aria-labelledby="sports-structure-title"
      className="mx-auto max-w-7xl px-6 py-24 md:px-10 md:py-32"
    >
      <div className="max-w-2xl">
        <h2
          className="text-4xl font-medium tracking-[-0.06em] text-white md:text-6xl"
          id="sports-structure-title"
        >
          高歌体育
        </h2>
        <p className="mt-5 max-w-lg text-sm leading-7 text-[rgb(var(--brand-muted))] md:text-base">
          球队与赛事并行生长，共同构成高歌体育的核心结构。
        </p>
      </div>

      <div className="mt-14 grid gap-4 md:grid-cols-[0.88fr_1.12fr]">
        {entities.map((entity) => (
          <article
            className={`group-sports-entity flex min-h-72 flex-col justify-between rounded-[24px] border border-white/10 p-7 md:p-9 ${
              entity.id === 'league' ? 'group-sports-entity--league md:min-h-96' : 'md:mt-16'
            }`}
            key={entity.id}
          >
            <span
              aria-hidden="true"
              className="text-7xl font-light tracking-[-0.08em] text-white/[0.08] md:text-9xl"
            >
              {entity.id === 'club' ? 'FC' : 'GSL'}
            </span>
            <div>
              <h3 className="text-3xl font-medium tracking-[-0.05em] text-white md:text-5xl">
                {entity.name}
              </h3>
              <p className="mt-4 text-sm text-[rgb(var(--brand-muted))]">{entity.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
