import FadeIn from '@/concepts/creator/components/FadeIn'
import ProjectCard from '@/concepts/creator/components/ProjectCard'
import { projects } from '@/concepts/creator/data'

export default function ProjectsSection() {
  return (
    <section
      id="projects"
      className="bg-ink relative z-10 -mt-10 rounded-t-[40px] px-5 pb-20 pt-20 sm:-mt-12 sm:rounded-t-[50px] sm:px-8 sm:pb-24 sm:pt-24 md:-mt-14 md:rounded-t-[60px] md:px-10 md:pb-32 md:pt-32"
    >
      <FadeIn y={40}>
        <h2 className="hero-heading mb-16 text-center text-[clamp(3rem,12vw,160px)] font-black uppercase leading-none tracking-tight sm:mb-20 md:mb-28">
          Project
        </h2>
      </FadeIn>

      <div className="mx-auto max-w-[1440px]">
        {projects.map((project, index) => (
          <ProjectCard
            key={project.number}
            index={index}
            project={project}
            totalCards={projects.length}
          />
        ))}
      </div>
    </section>
  )
}
