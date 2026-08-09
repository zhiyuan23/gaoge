import { forwardRef } from 'react'

import BrandNavigation, { type BrandNavigationHandle } from '@/brand/components/BrandNavigation'

interface SkiingNavbarProps {
  readonly onCapabilityOpenChange?: ((open: boolean) => void) | undefined
  readonly onGroupNavigate?: (() => void) | undefined
}

const SkiingNavbar = forwardRef<BrandNavigationHandle, SkiingNavbarProps>(function SkiingNavbar(
  { onCapabilityOpenChange, onGroupNavigate },
  ref,
) {
  return (
    <BrandNavigation
      ref={ref}
      current="home"
      onCapabilityOpenChange={onCapabilityOpenChange}
      onGroupNavigate={onGroupNavigate}
      overlay
    />
  )
})

export default SkiingNavbar
