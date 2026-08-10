import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

const digitalSections = [
  { id: 'digital-overview', label: '概览', mobileLabel: '概览' },
  { id: 'digital-current', label: '当前产品', mobileLabel: '产品' },
  { id: 'digital-roadmap', label: '产品规划', mobileLabel: '规划' },
  { id: 'digital-delivery', label: '交付能力', mobileLabel: '能力' },
] as const

type DigitalSectionId = (typeof digitalSections)[number]['id']

export default function DigitalSectionNavigation() {
  const reducedMotion = useReducedMotion()
  const intersectionRatios = useRef(new Map<DigitalSectionId, number>())
  const [activeSection, setActiveSection] = useState<DigitalSectionId>('digital-overview')

  useEffect(() => {
    const sections = digitalSections
      .map(({ id }) => document.getElementById(id))
      .filter((section): section is HTMLElement => Boolean(section))

    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          intersectionRatios.current.set(
            entry.target.id as DigitalSectionId,
            entry.intersectionRatio,
          )
        })

        const nextSection = digitalSections.reduce<DigitalSectionId>((current, section) => {
          const currentRatio = intersectionRatios.current.get(current) ?? 0
          const nextRatio = intersectionRatios.current.get(section.id) ?? 0
          return nextRatio > currentRatio ? section.id : current
        }, 'digital-overview')

        if ((intersectionRatios.current.get(nextSection) ?? 0) > 0) setActiveSection(nextSection)
      },
      { rootMargin: '-22% 0px -62% 0px', threshold: [0, 0.15, 0.4, 0.7] },
    )

    sections.forEach((section) => sectionObserver.observe(section))
    return () => sectionObserver.disconnect()
  }, [])

  useEffect(() => {
    const activeLink = document.querySelector<HTMLAnchorElement>(
      '[data-digital-section-active="true"]',
    )

    activeLink?.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'nearest',
      inline: 'center',
    })
  }, [activeSection, reducedMotion])

  return (
    <div aria-label="数字页面章节" className="digital-section-navigation min-w-0 flex-1">
      <div className="digital-section-navigation-track ml-auto flex items-center overflow-x-auto">
        {digitalSections.map((section) => {
          const isActive = activeSection === section.id

          return (
            <a
              aria-label={section.label}
              aria-current={isActive ? 'location' : undefined}
              className={`relative isolate flex h-11 shrink-0 items-center justify-center rounded-md px-2.5 text-xs font-medium tracking-[0.02em] transition-colors duration-150 hover:text-white/85 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-0 focus-visible:outline-white/55 md:h-10 md:px-3.5 md:text-sm ${
                isActive ? 'text-white' : 'text-white/45'
              }`}
              data-digital-section-active={isActive ? 'true' : undefined}
              href={`#${section.id}`}
              key={section.id}
            >
              {isActive ? (
                <motion.span
                  aria-hidden="true"
                  className="absolute bottom-[3px] left-[calc(50%-0.5rem)] h-px w-4 rounded-full bg-white/90 shadow-[0_0_8px_rgb(255_255_255/0.35)] md:bottom-0.5"
                  layoutId="digital-section-active-indicator"
                  transition={
                    reducedMotion
                      ? { duration: 0.01 }
                      : { bounce: 0, duration: 0.3, type: 'spring' }
                  }
                />
              ) : null}
              <span className="md:hidden">{section.mobileLabel}</span>
              <span className="hidden md:inline">{section.label}</span>
            </a>
          )
        })}
      </div>
    </div>
  )
}
