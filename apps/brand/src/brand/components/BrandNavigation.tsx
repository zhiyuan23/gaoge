import { motion, useReducedMotion } from 'framer-motion'
import { X } from 'lucide-react'
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

export type BrandArea = 'home' | 'digital' | 'content' | 'group'
export type CapabilityArea = 'digital' | 'content' | 'film' | 'sports'

export interface BrandNavigationHandle {
  openCapability(area: CapabilityArea, trigger: HTMLButtonElement): void
}

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
    description: '以影像与叙事思维，把想法转化为承载情感与表达的光影作品。',
    key: 'film',
    label: '影视',
    status: '影像创作',
  },
  {
    description: '以运动与连接的力量，把热爱转化为真实发生的共同体验。',
    key: 'sports',
    label: '体育',
    status: '体育生态',
  },
]

interface BrandMarkProps {
  readonly home?: boolean
}

function BrandMark({ home = false }: BrandMarkProps) {
  return (
    <span
      aria-hidden="true"
      className="grid h-6 w-6 place-items-center rounded-full border border-white/45 font-semibold leading-none text-white"
    >
      <span className={home ? 'inline-block -rotate-[30deg] text-[14px]' : 'text-[11px]'}>G</span>
    </span>
  )
}

const BrandNavigation = forwardRef<BrandNavigationHandle, BrandNavigationProps>(
  function BrandNavigation({ current, overlay = false }, ref) {
    const [activeArea, setActiveArea] = useState<CapabilityArea | null>(null)
    const [isPresented, setIsPresented] = useState(false)
    const closeButtonRef = useRef<HTMLButtonElement | null>(null)
    const dialogRef = useRef<HTMLDialogElement | null>(null)
    const triggerRef = useRef<HTMLButtonElement | null>(null)
    const reducedMotion = useReducedMotion()
    const activeCapability = activeArea
      ? brandAreas.find((area) => area.key === activeArea)
      : undefined
    const isDialogOpen = activeArea !== null

    function openCapability(area: CapabilityArea, trigger: HTMLButtonElement) {
      triggerRef.current = trigger
      setActiveArea(area)
      setIsPresented(true)
    }

    useImperativeHandle(ref, () => ({ openCapability }))

    function requestClose() {
      if (isDialogOpen) setIsPresented(false)
    }

    function finishClose() {
      if (isPresented) return

      const dialog = dialogRef.current
      if (dialog?.open) dialog.close()
      setActiveArea(null)
    }

    useEffect(() => {
      if (!isDialogOpen) return

      const dialog = dialogRef.current
      const previousOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      if (dialog && !dialog.open) dialog.showModal()
      closeButtonRef.current?.focus()

      return () => {
        document.body.style.overflow = previousOverflow
        if (dialog?.open) dialog.close()
        triggerRef.current?.focus()
      }
    }, [isDialogOpen])

    return (
      <>
        <header
          className={`left-0 right-0 top-0 z-20 ${
            current === 'group' ? 'px-4 pt-4 md:px-10 md:pt-6' : 'px-6 pt-6 md:px-10'
          } ${overlay ? 'absolute' : current === 'group' ? 'sticky' : 'relative'}`}
        >
          {current === 'group' ? (
            <nav
              aria-label="高歌品牌导航"
              className="brand-group-navigation brand-navigation-surface mx-auto flex h-[52px] max-w-7xl items-center rounded-full border p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_16px_40px_rgba(0,0,0,0.22)] md:h-14 md:p-1.5"
            >
              <Link
                aria-label="高歌首页"
                className="flex h-11 items-center gap-2 rounded-full px-3 text-white transition-colors hover:bg-white/[0.06] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-1 focus-visible:outline-white/40 md:px-4"
                to="/"
              >
                <BrandMark home />
                <span className="text-sm font-medium tracking-[0.08em] text-white">GAOGE</span>
              </Link>

              <div
                aria-label="高歌品牌领域"
                className="ml-auto hidden items-center gap-1 md:flex"
                role="list"
              >
                {brandAreas.map((area) => {
                  const className =
                    'rounded-full px-4 py-2 text-sm text-white/60 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white'

                  return (
                    <span key={area.key} role="listitem">
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
                    </span>
                  )
                })}
              </div>

              <span
                aria-current="page"
                className="ml-auto grid h-11 min-w-16 place-items-center rounded-full border border-white/10 bg-white/10 px-5 text-sm font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] md:ml-1"
              >
                集团
              </span>
            </nav>
          ) : (
            <nav
              aria-label="高歌品牌导航"
              className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4"
            >
              <Link
                aria-label="高歌首页"
                className="brand-navigation-surface col-start-1 row-start-1 flex w-fit items-center gap-2 rounded-full bg-neutral-900/90 py-3 pl-4 pr-6 backdrop-blur max-[384px]:gap-0 max-[384px]:px-3"
                to="/"
              >
                <BrandMark home={current === 'home'} />
                <span className="text-sm font-medium tracking-[0.08em] text-white max-[384px]:hidden">
                  GAOGE
                </span>
              </Link>

              <div
                aria-label="高歌品牌领域"
                className="brand-navigation-surface col-start-2 row-start-1 hidden items-center gap-1 rounded-full bg-neutral-900/90 px-3 py-2 backdrop-blur md:flex"
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
                          aria-label="体育，将在新窗口打开"
                          className={className}
                          href="https://sports.gaoge.cc"
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          {area.label}
                        </a>
                      ) : (
                        <span
                          aria-label="影视，独立页面筹备中"
                          className={`${className} cursor-default`}
                          title="独立页面筹备中"
                        >
                          {area.label}
                        </span>
                      )}
                    </span>
                  )
                })}
              </div>

              {current !== 'home' ? (
                <span
                  aria-label="当前品牌领域"
                  className="brand-navigation-surface col-start-2 row-start-1 grid h-11 place-items-center rounded-full bg-neutral-900/90 px-4 text-xs text-white/75 backdrop-blur md:hidden"
                >
                  {current === 'digital' ? '数字' : '内容'}
                </span>
              ) : null}

              {current === 'home' ? (
                <Link
                  aria-label="高歌集团"
                  className="brand-navigation-surface group col-start-3 row-start-1 inline-flex h-11 items-center justify-self-end rounded-full border border-white/15 bg-neutral-900/60 px-4 backdrop-blur transition-[background-color,border-color,transform] duration-150 hover:border-white/30 hover:bg-neutral-900/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-[0.97]"
                  title="高歌集团"
                  to="/group"
                >
                  <span className="whitespace-nowrap text-xs font-medium tracking-[0.06em] text-white/75 transition-colors group-hover:text-white">
                    高歌集团
                  </span>
                </Link>
              ) : (
                <NavLink
                  aria-label="集团"
                  className={({ isActive }) =>
                    `brand-navigation-surface col-start-3 row-start-1 justify-self-end rounded-full bg-neutral-900/90 px-5 py-3 text-sm text-white/70 backdrop-blur transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                      isActive ? 'text-white ring-1 ring-white/25' : ''
                    }`
                  }
                  to="/group"
                >
                  集团
                </NavLink>
              )}
            </nav>
          )}
        </header>

        {(current === 'home' || current === 'group') && activeCapability ? (
          <dialog
            aria-describedby="brand-capability-dialog-copy"
            aria-labelledby="brand-capability-dialog-title"
            className="brand-capability-dialog fixed inset-0 z-50 m-0 h-full max-h-none w-full max-w-none overflow-hidden border-0 bg-transparent px-4 py-4 text-left sm:px-5 sm:py-8"
            id="brand-capability-dialog"
            onCancel={(event) => {
              event.preventDefault()
              requestClose()
            }}
            onClick={requestClose}
            ref={dialogRef}
          >
            <motion.div
              aria-hidden="true"
              className="brand-capability-backdrop absolute inset-0 h-full w-full cursor-default"
              animate={{ opacity: isPresented ? 1 : 0 }}
              initial={{ opacity: 0 }}
              transition={{ duration: reducedMotion ? 0.01 : 0.18, ease: [0.23, 1, 0.32, 1] }}
            />

            <div
              className="relative flex min-h-full w-full items-center justify-center"
              data-testid="capability-dismiss-area"
            >
              <motion.section
                animate={{
                  opacity: isPresented ? 1 : 0,
                  transform: isPresented ? 'scale(1)' : reducedMotion ? 'scale(1)' : 'scale(0.96)',
                }}
                className="brand-capability-panel relative w-full max-w-2xl rounded-[28px] border p-6 text-white sm:p-8"
                data-testid="capability-panel"
                initial={{
                  opacity: 0,
                  transform: reducedMotion ? 'scale(1)' : 'scale(0.96)',
                }}
                onAnimationComplete={finishClose}
                onClick={(event) => event.stopPropagation()}
                transition={
                  reducedMotion ? { duration: 0.01 } : { duration: 0.25, ease: [0.23, 1, 0.32, 1] }
                }
              >
                <button
                  aria-label="关闭能力说明"
                  className="absolute right-5 top-5 z-10 grid h-11 w-11 place-items-center rounded-full border border-white/10 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                  onClick={requestClose}
                  ref={closeButtonRef}
                  type="button"
                >
                  <X aria-hidden="true" size={18} strokeWidth={1.5} />
                </button>

                <motion.div
                  animate={{ opacity: 1, transform: 'translateY(0)' }}
                  className="brand-capability-copy pr-10"
                  initial={{
                    opacity: reducedMotion ? 1 : 0.72,
                    transform: reducedMotion ? 'translateY(0)' : 'translateY(4px)',
                  }}
                  key={activeCapability.key}
                  transition={{ duration: reducedMotion ? 0.01 : 0.14, ease: [0.23, 1, 0.32, 1] }}
                >
                  <p className="text-xs uppercase tracking-[0.22em] text-white/55">高歌能力领域</p>
                  <h2
                    className="mt-4 text-3xl font-light tracking-[-0.04em] sm:text-4xl"
                    id="brand-capability-dialog-title"
                  >
                    {activeCapability.label}
                  </h2>
                  <p className="mt-3 text-sm uppercase tracking-[0.16em] text-white/55">
                    {activeCapability.status}
                  </p>
                  <p
                    className="mt-8 max-w-xl text-base leading-8 text-white/70"
                    id="brand-capability-dialog-copy"
                  >
                    {activeCapability.description}
                  </p>
                </motion.div>

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
                      onClick={() => {
                        setActiveArea(area.key)
                        setIsPresented(true)
                      }}
                      type="button"
                    >
                      {area.label}
                    </button>
                  ))}
                </div>
              </motion.section>
            </div>
          </dialog>
        ) : null}
      </>
    )
  },
)

export default BrandNavigation
