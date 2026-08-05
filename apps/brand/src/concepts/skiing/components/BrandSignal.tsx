import type { MouseEventHandler } from 'react'

interface BrandSignalProps {
  readonly ariaLabel: string
  readonly className: string
  readonly dividerClassName: string
  readonly dividerPosition: 'before' | 'after'
  readonly label: string
  readonly onClick: MouseEventHandler<HTMLButtonElement>
  readonly value: string
}

export default function BrandSignal({
  ariaLabel,
  className,
  dividerClassName,
  dividerPosition,
  label,
  onClick,
  value,
}: BrandSignalProps) {
  const mobileDivider = (
    <span
      aria-hidden="true"
      className={`brand-signal-divider brand-signal-divider--mobile block h-px w-12 bg-white/40 md:hidden ${dividerClassName}`}
    />
  )
  const desktopDivider = (
    <span
      aria-hidden="true"
      className={`brand-signal-divider brand-signal-divider--desktop hidden h-px w-24 bg-white/40 md:block ${dividerClassName}`}
    />
  )

  const content = (
    <span className="brand-signal-content flex items-center gap-3 md:block">
      {dividerPosition === 'before' ? mobileDivider : null}
      <span className="brand-signal-copy block">
        <span
          className={`brand-signal-row flex items-center gap-3 ${
            dividerPosition === 'before' ? 'md:justify-end' : ''
          }`}
        >
          {dividerPosition === 'before' ? desktopDivider : null}
          <span className="brand-signal-value text-xs font-semibold tracking-[0.2em] text-white/90 md:text-4xl md:font-medium md:tracking-[-0.04em] md:text-white">
            {value}
          </span>
          {dividerPosition === 'after' ? desktopDivider : null}
        </span>
        <span
          className={`brand-signal-label mt-1 block text-[11px] text-white/60 md:text-sm md:text-white/70 ${
            dividerPosition === 'before' ? 'md:text-right' : ''
          }`}
        >
          {label}
        </span>
      </span>
      {dividerPosition === 'after' ? mobileDivider : null}
    </span>
  )

  return (
    <button
      aria-label={ariaLabel}
      aria-haspopup="dialog"
      className={`${className} hero-signal min-h-12 cursor-pointer touch-manipulation px-0 py-2 text-left transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white active:scale-[0.98] md:min-h-0 md:rounded-[24px] md:px-0 md:py-0`}
      onClick={onClick}
      type="button"
    >
      {content}
    </button>
  )
}
