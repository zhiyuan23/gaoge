import { ArrowUpRight } from 'lucide-react'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'

import { concepts, getConceptPath } from '@/concepts/registry'

export default function ConceptIndexPage() {
  useEffect(() => {
    document.title = 'GAOGE Brand Concepts'
  }, [])

  return (
    <main className="min-h-[100dvh] bg-[#0c0c0c] px-5 py-8 text-[#d7e2ea] sm:px-8 sm:py-12 lg:px-12">
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-7xl flex-col sm:min-h-[calc(100dvh-6rem)]">
        <header className="flex flex-col gap-5 border-b border-white/15 pb-8 sm:flex-row sm:items-end sm:justify-between sm:pb-10">
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.24em] text-white/50">
              GAOGE / Brand
            </p>
            <h1 className="text-4xl font-semibold tracking-[-0.04em] text-white sm:text-6xl">
              Concepts
            </h1>
          </div>
          <p className="max-w-md text-sm leading-6 text-white/55 sm:text-base">
            浏览当前品牌首页概念。每个方案拥有独立路径，后续新增页面会自动出现在这里。
          </p>
        </header>

        <section
          aria-label="Brand concept pages"
          className="grid flex-1 gap-4 py-8 md:grid-cols-2 lg:grid-cols-3 lg:py-12"
        >
          {concepts.map((concept, index) => {
            const path = getConceptPath(concept.slug)

            return (
              <article
                className="group flex min-h-64 flex-col justify-between rounded-3xl border border-white/15 bg-white/[0.035] p-6 transition-colors hover:border-white/35 hover:bg-white/[0.06] sm:p-7"
                key={concept.slug}
              >
                <div>
                  <p className="mb-12 text-xs tracking-[0.18em] text-white/35">
                    {String(index + 1).padStart(2, '0')} / {concept.slug}
                  </p>
                  <h2 className="text-3xl font-medium tracking-[-0.03em] text-white">
                    {concept.name}
                  </h2>
                  <p className="mt-3 max-w-xs text-sm leading-6 text-white/50">
                    {concept.description}
                  </p>
                </div>

                <div className="mt-8 flex items-center gap-3">
                  <Link
                    className="inline-flex items-center rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition-colors hover:bg-white/80"
                    to={path}
                  >
                    查看页面
                  </Link>
                  <Link
                    aria-label={`在新标签页打开 ${concept.name}`}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:border-white/50 hover:bg-white/10"
                    rel="noreferrer"
                    target="_blank"
                    to={path}
                  >
                    <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            )
          })}
        </section>
      </div>
    </main>
  )
}
