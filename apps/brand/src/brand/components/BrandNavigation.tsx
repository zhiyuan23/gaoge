import { X } from 'lucide-react'
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

export type BrandArea = 'home' | 'digital' | 'content'
export type CapabilityArea = 'digital' | 'content' | 'sports' | 'future'

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

const BrandNavigation = forwardRef<BrandNavigationHandle, BrandNavigationProps>(
  function BrandNavigation({ current, overlay = false }, ref) {
    const [activeArea, setActiveArea] = useState<CapabilityArea | null>(null)
    const [isClosing, setIsClosing] = useState(false)
    const closeButtonRef = useRef<HTMLButtonElement | null>(null)
    const closeTimerRef = useRef<number | null>(null)
    const dialogRef = useRef<HTMLDialogElement | null>(null)
    const triggerRef = useRef<HTMLButtonElement | null>(null)
    const activeCapability = activeArea
      ? brandAreas.find((area) => area.key === activeArea)
      : undefined
    const isDialogOpen = activeArea !== null

    function openCapability(area: CapabilityArea, trigger: HTMLButtonElement) {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current)
        closeTimerRef.current = null
      }

      triggerRef.current = trigger
      setIsClosing(false)
      setActiveArea(area)
    }

    useImperativeHandle(ref, () => ({ openCapability }))

    function requestClose() {
      if (!isDialogOpen || isClosing || closeTimerRef.current !== null) return

      const dialog = dialogRef.current

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        if (dialog?.open) dialog.close()
        setActiveArea(null)
        return
      }

      setIsClosing(true)
      closeTimerRef.current = window.setTimeout(() => {
        if (dialog?.open) dialog.close()

        closeTimerRef.current = null
        setActiveArea(null)
        setIsClosing(false)
      }, 180)
    }

    useEffect(() => {
      if (!isDialogOpen) return

      const dialog = dialogRef.current
      const previousOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      if (dialog && !dialog.open) dialog.showModal()
      closeButtonRef.current?.focus()

      return () => {
        if (closeTimerRef.current !== null) {
          window.clearTimeout(closeTimerRef.current)
          closeTimerRef.current = null
        }

        document.body.style.overflow = previousOverflow
        if (dialog?.open) dialog.close()
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
          <nav
            aria-label="高歌品牌导航"
            className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4"
          >
            <Link
              aria-label="高歌首页"
              className="col-start-1 row-start-1 flex w-fit items-center gap-2 rounded-full bg-neutral-900/90 py-3 pl-4 pr-6 backdrop-blur max-[384px]:gap-0 max-[384px]:px-3"
              to="/"
            >
              {mark}
              <span className="text-sm font-medium tracking-[0.08em] text-white max-[384px]:hidden">
                GAOGE
              </span>
            </Link>

            <div
              aria-label="高歌品牌领域"
              className="col-start-2 row-start-1 hidden items-center gap-1 rounded-full bg-neutral-900/90 px-3 py-2 backdrop-blur md:flex"
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

            {current !== 'home' ? (
              <span
                aria-label="当前品牌领域"
                className="col-start-2 row-start-1 grid h-11 place-items-center rounded-full bg-neutral-900/90 px-4 text-xs text-white/75 backdrop-blur md:hidden"
              >
                {current === 'digital' ? '数字' : '内容'}
              </span>
            ) : null}

            <span
              aria-hidden="true"
              className="col-start-3 row-start-1 h-10 w-10 justify-self-end"
            />
          </nav>
        </header>

        {current === 'home' && activeCapability ? (
          <dialog
            aria-describedby="brand-capability-dialog-copy"
            aria-labelledby="brand-capability-dialog-title"
            className="brand-capability-dialog fixed inset-0 z-50 m-0 h-full max-h-none w-full max-w-none overflow-y-auto border-0 bg-transparent px-5 py-8 text-left"
            data-closing={isClosing ? '' : undefined}
            id="brand-capability-dialog"
            onCancel={(event) => {
              event.preventDefault()
              requestClose()
            }}
            ref={dialogRef}
          >
            <button
              aria-label="点击遮罩关闭能力说明"
              className="brand-capability-backdrop absolute inset-0 h-full w-full cursor-default"
              onClick={requestClose}
              tabIndex={-1}
              type="button"
            />

            <div className="relative mx-auto flex min-h-full max-w-2xl items-center justify-center">
              <section
                className="brand-capability-panel relative w-full rounded-[28px] border p-6 text-white sm:p-8"
                data-testid="capability-panel"
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

                <div className="brand-capability-copy pr-10" key={activeCapability.key}>
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
                      disabled={isClosing}
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
          </dialog>
        ) : null}
      </>
    )
  },
)

export default BrandNavigation
