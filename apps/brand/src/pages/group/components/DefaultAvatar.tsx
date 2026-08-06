import { CircleUserRound, UserRound } from 'lucide-react'

interface DefaultAvatarProps {
  readonly size?: 'compact' | 'standard'
  readonly variant?: 'person' | 'placeholder'
}

export default function DefaultAvatar({
  size = 'standard',
  variant = 'person',
}: DefaultAvatarProps) {
  const compact = size === 'compact'
  const placeholder = variant === 'placeholder'
  const AvatarIcon = placeholder ? CircleUserRound : UserRound

  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full border ${
        placeholder
          ? 'border-dashed border-white/15 bg-white/[0.025] text-[rgb(var(--brand-accent)/0.72)]'
          : 'border-[rgb(var(--brand-accent)/0.28)] bg-[rgb(var(--brand-accent)/0.1)] text-[rgb(var(--brand-accent))]'
      } ${compact ? 'h-10 w-10' : 'h-14 w-14'}`}
      data-avatar-size={size}
      data-avatar-variant={variant}
      data-testid="default-avatar"
    >
      <AvatarIcon
        className={placeholder ? 'h-6 w-6' : compact ? 'h-[18px] w-[18px]' : 'h-6 w-6'}
        strokeWidth={1.5}
      />
    </span>
  )
}
