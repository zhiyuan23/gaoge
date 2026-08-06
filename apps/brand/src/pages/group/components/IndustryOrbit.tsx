import { Link } from 'react-router-dom'

import type { GroupIndustry } from '@/pages/group/types'

interface IndustryOrbitProps {
  readonly industries: readonly GroupIndustry[]
}

function IndustryNode({ industry }: { readonly industry: GroupIndustry }) {
  const content = (
    <>
      <span className="text-lg font-medium tracking-[-0.03em] text-white md:text-base lg:text-lg">
        {industry.name}
      </span>
      {industry.alias ? (
        <span className="mt-1 text-xs text-[rgb(var(--brand-accent))]">{industry.alias}</span>
      ) : null}
      <span className="mt-4 text-xs leading-5 text-[rgb(var(--brand-muted))]">
        {industry.description}
      </span>
    </>
  )
  const className = `group-orbit-node flex min-h-36 flex-col p-5 md:min-h-0 md:p-4 lg:p-5 ${
    industry.status === 'future' ? 'group-orbit-node--future' : ''
  }`

  if (!industry.href) {
    return (
      <article className={className} data-industry={industry.id}>
        {content}
      </article>
    )
  }

  if (industry.target === '_blank') {
    return (
      <a
        className={className}
        data-industry={industry.id}
        href={industry.href}
        rel="noopener noreferrer"
        target="_blank"
      >
        {content}
      </a>
    )
  }

  return (
    <Link className={className} data-industry={industry.id} to={industry.href}>
      {content}
    </Link>
  )
}

export default function IndustryOrbit({ industries }: IndustryOrbitProps) {
  return (
    <section aria-label="高歌集团产业布局" className="group-orbit">
      <div aria-hidden="true" className="group-orbit-ring group-orbit-ring--outer" />
      <div aria-hidden="true" className="group-orbit-ring group-orbit-ring--inner" />
      <div aria-hidden="true" className="group-orbit-link group-orbit-link--horizontal" />
      <div aria-hidden="true" className="group-orbit-link group-orbit-link--diagonal" />

      <div className="group-orbit-core">
        <span className="text-2xl font-medium tracking-[-0.05em] text-white lg:text-3xl">
          高歌集团
        </span>
        <span className="mt-2 text-[10px] tracking-[0.16em] text-white/45">GAOGE GROUP</span>
      </div>

      <ol className="group-orbit-nodes">
        {industries.map((industry) => (
          <li data-orbit-slot={industry.id} key={industry.id}>
            <IndustryNode industry={industry} />
          </li>
        ))}
      </ol>
    </section>
  )
}
