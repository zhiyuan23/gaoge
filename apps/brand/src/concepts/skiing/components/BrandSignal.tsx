import { Link } from 'react-router-dom'

type BrandSignalDestination =
  | { readonly href: string; readonly to?: never }
  | { readonly href?: never; readonly to: string }

type BrandSignalProps = BrandSignalDestination & {
  readonly ariaLabel: string
  readonly className: string
  readonly dividerClassName: string
  readonly dividerPosition: 'before' | 'after'
  readonly label: string
  readonly value: string
}

export default function BrandSignal({
  ariaLabel,
  className,
  dividerClassName,
  dividerPosition,
  label,
  value,
  ...destination
}: BrandSignalProps) {
  const divider = (
    <span
      aria-hidden="true"
      className={`hidden h-px w-24 bg-white/40 md:block ${dividerClassName}`}
    />
  )

  const content = (
    <>
      <div
        className={`flex items-center gap-3 ${dividerPosition === 'before' ? 'justify-end' : ''}`}
      >
        {dividerPosition === 'before' ? divider : null}
        <p className="text-3xl font-medium tracking-[-0.04em] md:text-4xl">{value}</p>
        {dividerPosition === 'after' ? divider : null}
      </div>
      <p
        className={`mt-1 text-xs text-white/70 md:text-sm ${
          dividerPosition === 'before' ? 'text-right' : ''
        }`}
      >
        {label}
      </p>
    </>
  )

  const linkClassName = `${className} rounded-[24px] transition-transform active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white`

  if ('to' in destination) {
    return (
      <Link aria-label={ariaLabel} className={linkClassName} to={destination.to}>
        {content}
      </Link>
    )
  }

  return (
    <a
      aria-label={ariaLabel}
      className={linkClassName}
      href={destination.href}
      rel="noopener noreferrer"
      target="_blank"
    >
      {content}
    </a>
  )
}
