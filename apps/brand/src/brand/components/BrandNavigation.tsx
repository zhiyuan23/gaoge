import { UserRound, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

export type BrandArea = 'home' | 'digital' | 'content'
type CapabilityArea = 'digital' | 'content' | 'sports' | 'future'

interface BrandNavigationProps {
  readonly current: BrandArea
  readonly overlay?: boolean
}

interface CapabilityAreaInfo {
  readonly description: string
  readonly label: string
  readonly key: CapabilityArea
  readonly status: string
}

const brandAreas: readonly CapabilityAreaInfo[] = [
  {
    description: '以技术与产品思维，把想法转化为面向未来的数字能力。',
    key: 'digital',
    label: '数字',
    status: '产品矩阵',
  },
  {
    description: '以创意与内容思维，把热爱转化为持续生长的影响力。',
    key: 'content',
    label: '内容',
    status: '内容运营',
  },
  {
    description: '以运动与连接的力量，把热爱转化为真实发生的共同体验。',
    key: 'sports',
    label: '体育',
    status: '体育生态',
  },
  {
    description: '以好奇与行动不断探索，把未知转化为值得期待的新可能。',
    key: 'future',
    label: '未来',
    status: '领域拓展中',
  },
]

const mark = (
  <span
    aria-hidden="true"
    className="grid h-6 w-6 place-items-center rounded-full border border-white/45 text-[11px] font-semibold leading-none text-white"
  >
    G
  </span>
)

function getCurrentCapability(current: BrandArea): CapabilityArea {
  return current === 'digital' || current === 'content' ? current : 'digital'
}

export default function BrandNavigation({ current, overlay = false }: BrandNavigationProps) {
  const [activeArea, setActiveArea] = useState<CapabilityArea | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const currentCapability = getCurrentCapability(current)
  const activeCapability = activeArea
    ? brandAreas.find((area) => area.key === activeArea)
    : undefined
  const isDialogOpen = activeArea !== null

  function openCapability(area: CapabilityArea, trigger: HTMLButtonElement) {
    triggerRef.current = trigger
    setActiveArea(area)
  }

  useEffect(() => {
    if (!isDialogOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActiveArea(null)
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)
    closeButtonRef.current?.focus()

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
      triggerRef.current?.focus()
    }
  }, [isDialogOpen])

  return (
    <>
      <header
        className={`left-0 right-0 top-0 z-20 px-6 pt-6 md:px-10 ${
          overlay ? 'absolute' : 'relative'
        }`}
      >
        <nav aria-label="高歌品牌导航" className="flex items-center justify-between gap-4">
          <Link
            aria-label="高歌首页"
            className="flex items-center gap-2 rounded-full bg-neutral-900/90 py-3 pl-4 pr-6 backdrop-blur"
            to="/"
          >
            {mark}
            <span className="text-sm font-medium tracking-[0.08em] text-white">GAOGE</span>
          </Link>

          <div
            aria-label="高歌品牌领域"
            className="hidden items-center gap-1 rounded-full bg-neutral-900/90 px-3 py-2 backdrop-blur md:flex"
            role="list"
          >
            {brandAreas.map((area) => {
              const isCurrent = area.key === current
              const className = `rounded-full px-5 py-2 text-sm text-neutral-300 transition-colors duration-200 hover:text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-1 focus-visible:outline-white/35 ${
                isCurrent ? 'bg-white/10 text-white' : ''
              }`

              return (
                <span key={area.key} role="listitem">
                  {current === 'home' ? (
                    <button
                      aria-controls="brand-capability-dialog"
                      aria-expanded={activeArea === area.key}
                      aria-haspopup="dialog"
                      className={className}
                      onClick={(event) => openCapability(area.key, event.currentTarget)}
                      type="button"
                    >
                      {area.label}
                    </button>
                  ) : area.key === 'digital' || area.key === 'content' ? (
                    <NavLink className={className} to={`/${area.key}`}>
                      {area.label}
                    </NavLink>
                  ) : area.key === 'sports' ? (
                    <a
                      className={className}
                      href="https://sports.gaoge.cc"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {area.label}
                    </a>
                  ) : (
                    <span
                      aria-label="未来，领域拓展中"
                      className={`${className} cursor-default`}
                      title="领域拓展中"
                    >
                      {area.label}
                    </span>
                  )}
                </span>
              )
            })}
          </div>

          {current === 'home' ? (
            <button
              aria-label="打开高歌品牌能力说明"
              className="absolute left-1/2 -translate-x-1/2 rounded-full bg-neutral-900/90 px-4 py-2 text-xs text-white/75 backdrop-blur md:hidden"
              onClick={(event) => openCapability(currentCapability, event.currentTarget)}
              type="button"
            >
              高歌
            </button>
          ) : (
            <span
              aria-label="当前品牌领域"
              className="absolute left-1/2 -translate-x-1/2 rounded-full bg-neutral-900/90 px-4 py-2 text-xs text-white/75 backdrop-blur md:hidden"
            >
              {current === 'digital' ? '数字' : '内容'}
            </span>
          )}

          <button
            aria-label="开发者联系方式，敬请期待"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/15 bg-neutral-950/35 text-white/60 backdrop-blur-sm"
            disabled
            title="开发者联系方式，敬请期待"
            type="button"
          >
            <UserRound aria-hidden="true" size={19} strokeWidth={1.4} />
          </button>
        </nav>
      </header>

      {current === 'home' && activeCapability ? (
        <div
          aria-describedby="brand-capability-dialog-copy"
          aria-labelledby="brand-capability-dialog-title"
          aria-modal="true"
          className="fixed inset-0 z-50 overflow-y-auto bg-black/70 px-5 py-8 backdrop-blur-sm"
          id="brand-capability-dialog"
          role="dialog"
        >
          <button
            aria-label="点击遮罩关闭能力说明"
            className="absolute inset-0 h-full w-full cursor-default"
            onClick={() => setActiveArea(null)}
            tabIndex={-1}
            type="button"
          />

          <div className="relative mx-auto flex min-h-full max-w-2xl items-center justify-center">
            <section className="relative w-full rounded-[28px] border border-white/15 bg-neutral-950 p-6 text-white shadow-2xl shadow-black/40 sm:p-8">
              <button
                aria-label="关闭能力说明"
                className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full border border-white/10 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                onClick={() => setActiveArea(null)}
                ref={closeButtonRef}
                type="button"
              >
                <X aria-hidden="true" size={18} strokeWidth={1.5} />
              </button>

              <div className="pr-10">
                <p className="text-xs uppercase tracking-[0.22em] text-white/45">高歌能力领域</p>
                <h2
                  className="mt-4 text-3xl font-light tracking-[-0.04em] sm:text-4xl"
                  id="brand-capability-dialog-title"
                >
                  {activeCapability.label}
                </h2>
                <p className="mt-3 text-sm uppercase tracking-[0.16em] text-white/45">
                  {activeCapability.status}
                </p>
                <p
                  className="mt-8 max-w-xl text-base leading-8 text-white/70"
                  id="brand-capability-dialog-copy"
                >
                  {activeCapability.description}
                </p>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {brandAreas.map((area) => (
                  <button
                    aria-pressed={activeCapability.key === area.key}
                    className={`rounded-2xl border px-3 py-3 text-sm transition-colors ${
                      activeCapability.key === area.key
                        ? 'border-white/30 bg-white/10 text-white'
                        : 'border-white/10 text-white/55 hover:bg-white/5 hover:text-white'
                    }`}
                    key={area.key}
                    onClick={() => setActiveArea(area.key)}
                    type="button"
                  >
                    {area.label}
                  </button>
                ))}
              </div>
            </section>
          </div>
        </div>
      ) : null}
    </>
  )
}
