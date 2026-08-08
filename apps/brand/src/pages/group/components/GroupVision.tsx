import type { GroupVisionItem } from '@/pages/group/types'

interface GroupVisionProps {
  readonly items: readonly GroupVisionItem[]
}

export default function GroupVision({ items }: GroupVisionProps) {
  return (
    <section
      aria-labelledby="group-vision-title"
      className="mx-auto max-w-7xl px-6 py-24 md:px-10 md:py-32"
    >
      <p className="mb-4 text-sm text-[rgb(var(--brand-accent))]">GROUP VISION</p>
      <h2
        className="text-4xl font-medium tracking-[-0.06em] text-white md:text-6xl"
        id="group-vision-title"
      >
        集团愿景
      </h2>
      <p className="mt-6 max-w-3xl text-3xl leading-tight tracking-[-0.05em] text-white md:text-5xl">
        让每一份热爱，都有持续生长的可能。
      </p>

      <div className="mt-12 grid gap-3 md:grid-cols-3">
        {items.map((item) => (
          <article
            className="rounded-[24px] border border-white/10 bg-white/[0.025] p-6 md:min-h-52 md:p-7"
            key={item.id}
          >
            <h3 className="text-xl font-medium tracking-[-0.04em] text-white">{item.title}</h3>
            <p className="mt-4 text-sm leading-7 text-[rgb(var(--brand-muted))]">
              {item.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}
