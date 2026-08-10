import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

const groupSections = [
  { id: 'group-overview', label: '概览' },
  { id: 'group-digital', label: '数字' },
  { id: 'group-content', label: '内容' },
  { id: 'group-sports', label: '体育' },
  { id: 'group-leadership', label: '管理层' },
  { id: 'group-board', label: '董事会' },
  { id: 'group-vision', label: '愿景' },
] as const

type GroupSectionId = (typeof groupSections)[number]['id']

interface NavigationSection {
  readonly activeIds: readonly GroupSectionId[]
  readonly id: GroupSectionId
  readonly label: string
}

const desktopNavigationSections = groupSections.map((section) => ({
  ...section,
  activeIds: [section.id],
})) satisfies readonly NavigationSection[]

const mobileNavigationSections = [
  { activeIds: ['group-overview'], id: 'group-overview', label: '概览' },
  { activeIds: ['group-digital'], id: 'group-digital', label: '数字' },
  { activeIds: ['group-content'], id: 'group-content', label: '内容' },
  { activeIds: ['group-sports'], id: 'group-sports', label: '体育' },
  {
    activeIds: ['group-leadership', 'group-board', 'group-vision'],
    id: 'group-leadership',
    label: '集团',
  },
] satisfies readonly NavigationSection[]

interface GroupSectionNavigationProps {
  readonly active?: boolean
}

export default function GroupSectionNavigation({ active = true }: GroupSectionNavigationProps) {
  const reducedMotion = useReducedMotion()
  const intersectionRatios = useRef(new Map<GroupSectionId, number>())
  const [activeSection, setActiveSection] = useState<GroupSectionId>('group-overview')
  const [usesDesktopNavigation, setUsesDesktopNavigation] = useState(
    () => window.matchMedia('(min-width: 768px)').matches,
  )

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)')
    const updateNavigation = () => setUsesDesktopNavigation(mediaQuery.matches)

    updateNavigation()
    mediaQuery.addEventListener('change', updateNavigation)
    return () => mediaQuery.removeEventListener('change', updateNavigation)
  }, [])

  useEffect(() => {
    const sections = groupSections
      .map(({ id }) => document.getElementById(id))
      .filter((section): section is HTMLElement => Boolean(section))

    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          intersectionRatios.current.set(entry.target.id as GroupSectionId, entry.intersectionRatio)
        })

        const nextSection = groupSections.reduce<GroupSectionId>((current, section) => {
          const currentRatio = intersectionRatios.current.get(current) ?? 0
          const nextRatio = intersectionRatios.current.get(section.id) ?? 0
          return nextRatio > currentRatio ? section.id : current
        }, 'group-overview')

        if ((intersectionRatios.current.get(nextSection) ?? 0) > 0) setActiveSection(nextSection)
      },
      { rootMargin: '-22% 0px -62% 0px', threshold: [0, 0.15, 0.4, 0.7] },
    )

    sections.forEach((section) => sectionObserver.observe(section))
    return () => sectionObserver.disconnect()
  }, [])

  useEffect(() => {
    if (!active) return

    const activeLink = document.querySelector<HTMLAnchorElement>(
      '[data-group-section-active="true"]',
    )

    activeLink?.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'nearest',
      inline: 'center',
    })
  }, [active, activeSection, reducedMotion, usesDesktopNavigation])

  const navigationSections = usesDesktopNavigation
    ? desktopNavigationSections
    : mobileNavigationSections

  return (
    <div aria-label="集团页面章节" className="group-section-navigation min-w-0 flex-1">
      <div className="group-section-navigation-track ml-auto flex items-center overflow-x-auto">
        {navigationSections.map((section) => {
          const isActive = section.activeIds.some((sectionId) => sectionId === activeSection)

          return (
            <a
              aria-current={isActive ? 'location' : undefined}
              className={`group-section-navigation-link relative isolate flex h-11 shrink-0 items-center justify-center rounded-md px-2.5 text-xs font-medium tracking-[0.02em] transition-colors duration-150 hover:text-white/85 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-0 focus-visible:outline-white/55 md:h-10 md:px-3.5 md:text-sm ${
                isActive ? 'group-section-navigation-link--active text-white' : 'text-white/45'
              }`}
              data-group-section-active={isActive ? 'true' : undefined}
              data-group-section-link={section.id}
              href={`#${section.id}`}
              key={section.id}
            >
              {isActive ? (
                <motion.span
                  aria-hidden="true"
                  className="absolute bottom-[3px] left-[calc(50%-0.5rem)] h-px w-4 rounded-full bg-white/90 shadow-[0_0_8px_rgb(255_255_255/0.35)] md:bottom-0.5"
                  layoutId="group-section-active-indicator"
                  transition={
                    reducedMotion
                      ? { duration: 0.01 }
                      : { bounce: 0, duration: 0.3, type: 'spring' }
                  }
                />
              ) : null}
              <span>{section.label}</span>
            </a>
          )
        })}
      </div>
    </div>
  )
}
