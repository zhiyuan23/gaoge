import ScrollRevealText from '@/concepts/coding/components/ScrollRevealText'
import WordsPullUpMultiStyle from '@/concepts/coding/components/WordsPullUpMultiStyle'
import { aboutBody } from '@/concepts/coding/data'

const aboutHeading = [
  {
    className: 'font-normal',
    text: 'I am Marcus Chen,',
  },
  {
    className: 'font-serif italic leading-[1.1] pb-1',
    text: 'a self-taught director.',
  },
  {
    className: 'font-normal',
    text: 'I have skills in color grading, visual effects, and narrative design.',
  },
] as const

export default function AboutSection() {
  return (
    <section id="prisma-about" className="bg-black px-4 py-20 sm:px-6 md:py-28">
      <div className="mx-auto max-w-6xl bg-[#101010] px-6 py-24 text-center sm:px-10 sm:py-28 md:px-16 md:py-36">
        <p className="text-primary text-[10px] sm:text-xs">Visual arts</p>

        <h2
          aria-label="I am Marcus Chen, a self-taught director. I have skills in color grading, visual effects, and narrative design."
          className="mx-auto mt-8 max-w-3xl text-3xl font-normal leading-[0.95] text-[#E1E0CC] sm:text-4xl sm:leading-[0.9] md:text-5xl lg:text-6xl xl:text-7xl"
        >
          <WordsPullUpMultiStyle segments={aboutHeading} />
        </h2>

        <ScrollRevealText
          className="mx-auto mt-16 max-w-2xl text-xs leading-relaxed text-[#DEDBC8] sm:mt-20 sm:text-sm md:text-base"
          text={aboutBody}
        />
      </div>
    </section>
  )
}
