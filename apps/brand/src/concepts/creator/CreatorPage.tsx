import { useEffect } from 'react'

import AboutSection from '@/concepts/creator/sections/AboutSection'
import HeroSection from '@/concepts/creator/sections/HeroSection'
import MarqueeSection from '@/concepts/creator/sections/MarqueeSection'
import ProjectsSection from '@/concepts/creator/sections/ProjectsSection'
import ServicesSection from '@/concepts/creator/sections/ServicesSection'

export default function CreatorPage() {
  useEffect(() => {
    document.title = 'Creator concept'
  }, [])

  return (
    <main className="bg-ink min-h-[100dvh] overflow-x-clip">
      <HeroSection />
      <MarqueeSection />
      <AboutSection />
      <ServicesSection />
      <ProjectsSection />
    </main>
  )
}
