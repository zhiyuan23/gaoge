import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { type CSSProperties, useRef } from 'react'

import ImageWithFallback from '@/concepts/creator/components/ImageWithFallback'
import LiveProjectButton from '@/concepts/creator/components/LiveProjectButton'
import type { ProjectItem } from '@/concepts/creator/types'

interface ProjectCardProps {
  readonly index: number
  readonly project: ProjectItem
  readonly totalCards: number
}

export default function ProjectCard({ index, project, totalCards }: ProjectCardProps) {
  const cardContainerRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: cardContainerRef,
    offset: ['start end', 'end start'],
  })
  const targetScale = 1 - (totalCards - 1 - index) * 0.03
  const scale = useTransform(scrollYProgress, [0, 1], [1, targetScale])
  const stickyStyle = {
    '--card-offset': `${index * 28}px`,
  } as CSSProperties

  return (
    <div ref={cardContainerRef} className="relative h-[85vh]" style={stickyStyle}>
      <motion.article
        className="border-mist bg-ink text-mist sticky top-[calc(6rem+var(--card-offset))] overflow-hidden rounded-[40px] border-2 p-4 sm:rounded-[50px] sm:p-6 md:top-[calc(8rem+var(--card-offset))] md:rounded-[60px] md:p-8"
        style={{
          scale: reduceMotion ? 1 : scale,
          transformOrigin: 'top center',
        }}
      >
        <div className="mb-5 grid items-start gap-4 sm:mb-6 md:mb-8 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center md:gap-8">
          <p className="text-[clamp(3rem,10vw,140px)] font-black leading-[0.8] tracking-tight">
            {project.number}
          </p>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.24em] opacity-60 sm:text-sm">
              {project.category}
            </p>
            <h3 className="mt-1 text-[clamp(1.35rem,3.2vw,3.5rem)] font-medium uppercase leading-none tracking-tight">
              {project.name}
            </h3>
          </div>
          <div className="justify-self-start md:justify-self-end">
            <LiveProjectButton />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-[2fr_3fr]">
          <div className="grid gap-3">
            <ImageWithFallback
              alt={`${project.name}, first project view`}
              className="h-[clamp(130px,16vw,230px)] w-full rounded-[40px] object-cover sm:rounded-[50px] md:rounded-[60px]"
              decoding="async"
              loading="lazy"
              src={project.images[0]}
            />
            <ImageWithFallback
              alt={`${project.name}, second project view`}
              className="h-[clamp(160px,22vw,340px)] w-full rounded-[40px] object-cover sm:rounded-[50px] md:rounded-[60px]"
              decoding="async"
              loading="lazy"
              src={project.images[1]}
            />
          </div>
          <ImageWithFallback
            alt={`${project.name}, featured project view`}
            className="h-[clamp(300px,calc(38vw+12px),582px)] w-full rounded-[40px] object-cover sm:rounded-[50px] md:rounded-[60px]"
            decoding="async"
            loading="lazy"
            src={project.images[2]}
          />
        </div>
      </motion.article>
    </div>
  )
}
