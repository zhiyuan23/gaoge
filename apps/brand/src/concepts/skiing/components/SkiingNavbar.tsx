import { forwardRef } from 'react'

import BrandNavigation, { type BrandNavigationHandle } from '@/brand/components/BrandNavigation'

const SkiingNavbar = forwardRef<BrandNavigationHandle>(function SkiingNavbar(_, ref) {
  return <BrandNavigation ref={ref} current="home" overlay />
})

export default SkiingNavbar
