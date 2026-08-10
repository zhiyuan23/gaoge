import GroupModuleLink from '@/pages/group/components/GroupModuleLink'
import type { GroupContentOverview } from '@/pages/group/types'

interface ContentStructureProps {
  readonly overview: GroupContentOverview
}

export default function ContentStructure({ overview }: ContentStructureProps) {
  return (
    <section
      aria-labelledby="group-content-title"
      className="group-page-section mx-auto max-w-[1440px] scroll-mt-32 px-6 py-16 md:px-10 md:py-24"
      id="group-content"
    >
      <div>
        <p className="text-sm text-[rgb(var(--brand-accent))]">以内容连接热爱</p>
        <div className="mt-4 flex items-center justify-between gap-6">
          <h2
            className="font-display-cn shrink-0 text-4xl font-medium tracking-[-0.025em] text-white md:text-6xl"
            id="group-content-title"
          >
            高歌内容
          </h2>
          <GroupModuleLink label="进入高歌内容" shortLabel="进入内容" to={overview.href} />
        </div>
      </div>

      <article
        className="group-content-card group relative mt-10 flex min-h-[22rem] flex-col justify-between overflow-hidden rounded-[24px] border border-white/10 bg-[rgb(var(--brand-surface)/0.82)] p-6 transition-[border-color,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-1 hover:border-white/25 active:translate-y-0 active:scale-[0.985] md:mt-12 md:min-h-[26rem] md:p-10"
        data-testid="group-content-card"
      >
        <span aria-hidden="true" className="group-content-card-field" />
        <div className="relative z-10">
          <p className="text-[10px] tracking-[0.18em] text-white/45 md:text-xs">
            {overview.eyebrow}
          </p>
        </div>

        <div className="relative z-10">
          <h3
            aria-label={overview.headline.join('')}
            className="font-display-cn max-w-3xl text-4xl font-medium leading-[1.02] tracking-[-0.025em] text-white sm:text-5xl md:text-7xl"
          >
            <span className="block">{overview.headline[0]}</span>
            <span className="block">{overview.headline[1]}</span>
          </h3>
          <p className="mt-5 max-w-md text-sm leading-7 text-[rgb(var(--brand-muted))] md:text-base">
            {overview.description}
          </p>
          <ul
            aria-label="高歌内容核心能力"
            className="group-content-capabilities mt-8 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/10 pt-5 text-xs text-white/70 md:mt-10 md:gap-x-8 md:text-sm"
          >
            {overview.capabilities.map((capability) => (
              <li key={capability}>{capability}</li>
            ))}
          </ul>
        </div>
      </article>
    </section>
  )
}
