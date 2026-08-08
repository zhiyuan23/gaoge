interface DefaultAvatarProps {
  readonly label: string
  readonly marker: string
  readonly variant: 'director' | 'leader'
}

export default function DefaultAvatar({ label, marker, variant }: DefaultAvatarProps) {
  const director = variant === 'director'
  const glyph = Array.from(label.trim())[0] ?? 'G'
  const size = director ? 'compact' : 'standard'

  return (
    <span
      aria-hidden="true"
      className={`relative flex shrink-0 items-center justify-center border text-[rgb(var(--brand-accent))] shadow-[inset_0_1px_0_rgb(255_255_255/0.08)] ${
        director
          ? 'h-10 w-10 rounded-full border-[rgb(var(--brand-accent)/0.24)] bg-[linear-gradient(145deg,rgb(var(--brand-accent)/0.13),rgb(var(--brand-accent)/0.035))]'
          : 'h-14 w-14 rounded-[18px] border-[rgb(var(--brand-accent)/0.34)] bg-[linear-gradient(145deg,rgb(var(--brand-accent)/0.2),rgb(var(--brand-accent)/0.055))]'
      }`}
      data-avatar-size={size}
      data-avatar-variant={variant}
      data-testid="default-avatar"
    >
      <span
        className={
          director
            ? 'text-sm font-medium tracking-[-0.08em]'
            : 'text-[22px] font-medium tracking-[-0.08em]'
        }
        data-avatar-glyph=""
      >
        {glyph}
      </span>
      <span
        className={`absolute -bottom-1 -right-1 flex items-center justify-center rounded-full border-2 border-[#0c0f0d] bg-[rgb(var(--brand-accent))] font-semibold leading-none text-[#0c0f0d] ${
          director ? 'min-h-4 min-w-4 px-0.5 text-[7px]' : 'h-[18px] w-[18px] text-[8px]'
        }`}
        data-avatar-marker=""
      >
        {marker}
      </span>
    </span>
  )
}
