import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'

type GroupModuleLinkProps = {
  readonly label: string
  readonly shortLabel: string
} & (
  | { readonly href: string; readonly to?: never }
  | { readonly href?: never; readonly to: '/content' | '/digital' }
)

const className =
  'group inline-flex h-11 shrink-0 touch-manipulation items-center gap-1.5 whitespace-nowrap px-0 text-xs font-medium tracking-[0.02em] text-white/55 transition-[background-color,border-color,color,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:text-white/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[rgb(var(--brand-accent))] active:scale-[0.96] active:text-white/80 motion-reduce:transition-none motion-reduce:active:transform-none md:h-10 md:-translate-y-1 md:rounded-lg md:border md:border-white/10 md:bg-white/[0.035] md:px-3.5 md:text-white/70 md:shadow-[inset_0_1px_0_rgb(255_255_255/0.05)] md:hover:border-white/20 md:hover:bg-white/[0.065] md:hover:text-white'

export default function GroupModuleLink(props: GroupModuleLinkProps) {
  const content = (
    <>
      <span>{props.shortLabel}</span>
      <ArrowUpRight
        aria-hidden="true"
        className="text-white/40 transition-[color,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[rgb(var(--brand-accent))] motion-reduce:transform-none motion-reduce:transition-none md:text-white/60"
        size={14}
        strokeWidth={1.5}
      />
    </>
  )

  if (props.href !== undefined) {
    return (
      <a
        aria-label={props.label}
        className={className}
        href={props.href}
        rel="noopener noreferrer"
        target="_blank"
      >
        {content}
      </a>
    )
  }

  return (
    <Link aria-label={props.label} className={className} to={props.to}>
      {content}
    </Link>
  )
}
