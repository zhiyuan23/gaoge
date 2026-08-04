import { useEffect } from 'react'

import AboutSection from '@/concepts/coding/sections/AboutSection'
import FeaturesSection from '@/concepts/coding/sections/FeaturesSection'
import HeroSection from '@/concepts/coding/sections/HeroSection'

export default function CodingPage() {
  useEffect(() => {
    document.title = 'Coding concept'
    document.body.classList.add('prisma-active')

    return () => {
      document.body.classList.remove('prisma-active')
    }
  }, [])

  return (
    <main className="prisma-page min-h-screen overflow-x-clip bg-black">
      <HeroSection />
      <AboutSection />
      <FeaturesSection />
    </main>
  )
}
