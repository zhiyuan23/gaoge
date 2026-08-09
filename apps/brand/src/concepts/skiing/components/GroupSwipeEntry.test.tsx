import { fireEvent, render, screen } from '@testing-library/react'
import { type MotionValue } from 'framer-motion'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import GroupSwipeEntry from '@/concepts/skiing/components/GroupSwipeEntry'

let reducedMotion = false
let deferAnimations = false
let finishDeferredAnimations: Array<() => void> = []

class PointerEventMock extends MouseEvent {
  readonly pointerId: number
  readonly pointerType: string

  constructor(type: string, init: PointerEventInit = {}) {
    super(type, init)
    this.pointerId = init.pointerId ?? 0
    this.pointerType = init.pointerType ?? 'mouse'
  }
}

function setCoarsePointer(coarse: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches: query === '(pointer: coarse)' ? coarse : false,
      media: query,
      onchange: null,
      removeEventListener: vi.fn(),
      removeListener: vi.fn(),
    })),
  })
}

vi.mock('framer-motion', async (importOriginal) => ({
  ...(await importOriginal<typeof import('framer-motion')>()),
  animate: (value: MotionValue<number>, target: number) => {
    value.set(target)
    const finished = deferAnimations
      ? new Promise<void>((resolve) => finishDeferredAnimations.push(resolve))
      : Promise.resolve()

    return Object.assign(finished, { stop: vi.fn() })
  },
  useReducedMotion: () => reducedMotion,
}))

interface RenderEntryOptions {
  readonly disabled?: boolean
  readonly groupContent?: React.ReactNode | null
  readonly groupReady?: boolean
  readonly homeContent?: React.ReactNode
  readonly mode?: 'group' | 'home'
  readonly onComplete?: ReturnType<typeof vi.fn>
  readonly onPrepareGroup?: ReturnType<typeof vi.fn>
}

function renderEntry({
  disabled = false,
  groupContent,
  groupReady = true,
  homeContent = <div>首页内容</div>,
  mode = 'home',
  onComplete = vi.fn(),
  onPrepareGroup = vi.fn().mockResolvedValue(true),
}: RenderEntryOptions = {}) {
  const result = render(
    <GroupSwipeEntry
      disabled={disabled}
      groupContent={
        groupContent === undefined && groupReady ? (
          <div data-testid="real-group">真实集团页</div>
        ) : (
          (groupContent ?? null)
        )
      }
      groupReady={groupReady}
      homeContent={homeContent}
      mode={mode}
      onComplete={onComplete}
      onPrepareGroup={onPrepareGroup}
    />,
  )

  return { ...result, onComplete, onPrepareGroup }
}

describe('GroupSwipeEntry', () => {
  beforeEach(() => {
    reducedMotion = false
    deferAnimations = false
    finishDeferredAnimations = []
    setCoarsePointer(false)
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 844 })
    Object.defineProperty(window, 'PointerEvent', {
      configurable: true,
      value: PointerEventMock,
    })
    Object.defineProperty(window, 'scrollTo', {
      configurable: true,
      value: vi.fn(),
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('uses a compact chevron while preserving the accessible button and click action', async () => {
    const { onComplete } = renderEntry()
    const entry = screen.getByRole('button', { name: '上滑了解高歌集团' })

    expect(screen.getByTestId('group-swipe-chevron')).toBeInTheDocument()
    expect(entry).not.toHaveTextContent('上滑了解高歌集团')
    expect(entry).toHaveClass('min-h-11', 'min-w-11')

    fireEvent.click(entry)

    await vi.waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1))
  })

  it('stages the real group content outside the accessible tree', () => {
    renderEntry()
    const groupLayer = screen.getByTestId('group-swipe-group-layer')

    expect(screen.getByTestId('real-group')).toBeInTheDocument()
    expect(groupLayer).toHaveAttribute('aria-hidden', 'true')
    expect(groupLayer).toHaveAttribute('inert')
    expect(screen.queryByTestId('group-transition-preview')).not.toBeInTheDocument()
  })

  it('keeps the same group node when switching to group mode', () => {
    const groupContent = <div data-testid="real-group">真实集团页</div>
    const onComplete = vi.fn()
    const onPrepareGroup = vi.fn().mockResolvedValue(true)
    const view = renderEntry({ groupContent, onComplete, onPrepareGroup })
    const groupNode = screen.getByTestId('real-group')

    view.rerender(
      <GroupSwipeEntry
        disabled={false}
        groupContent={groupContent}
        groupReady
        homeContent={<div>首页内容</div>}
        mode="group"
        onComplete={onComplete}
        onPrepareGroup={onPrepareGroup}
      />,
    )

    expect(screen.getByTestId('real-group')).toBe(groupNode)
    expect(screen.getByTestId('group-swipe-group-layer')).not.toHaveAttribute('inert')
    expect(window.scrollTo).toHaveBeenCalledWith({ left: 0, top: 0 })
  })

  it('moves the home and real group layers from one continuous offset', async () => {
    renderEntry()
    const entry = screen.getByRole('button', { name: '上滑了解高歌集团' })

    fireEvent.pointerDown(entry, { clientY: 700, pointerId: 1 })
    fireEvent.pointerMove(entry, { clientY: 600, pointerId: 1 })

    await vi.waitFor(() => {
      expect(screen.getByTestId('group-swipe-home-layer')).toHaveStyle({
        transform: 'translate3d(0, -100px, 0)',
      })
      expect(screen.getByTestId('group-swipe-group-layer').style.transform).toContain(
        'calc(100dvh + -100px)',
      )
    })
  })

  it('commits a mobile drag from the noninteractive homepage surface at 18 percent', async () => {
    setCoarsePointer(true)
    const { onComplete } = renderEntry({
      homeContent: <div data-testid="home-surface">首页内容</div>,
    })
    const surface = screen.getByTestId('home-surface')

    fireEvent.pointerDown(surface, { clientY: 700, pointerId: 1, pointerType: 'touch' })
    fireEvent.pointerMove(surface, { clientY: 548, pointerId: 1, pointerType: 'touch' })
    fireEvent.pointerUp(surface, { clientY: 548, pointerId: 1, pointerType: 'touch' })

    await vi.waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1))
  })

  it.each(['link', 'button', 'input', 'dialog', 'ignored'] as const)(
    'does not start the mobile page gesture from %s content',
    (targetName) => {
      setCoarsePointer(true)
      const { onComplete } = renderEntry({
        homeContent: (
          <div>
            <a data-testid="link" href="/content">
              链接
            </a>
            <button data-testid="button" type="button">
              能力
            </button>
            <input aria-label="输入" data-testid="input" />
            <dialog data-testid="dialog">弹层</dialog>
            <div data-group-transition-ignore data-testid="ignored">
              忽略区域
            </div>
          </div>
        ),
      })
      const target = screen.getByTestId(targetName)

      fireEvent.pointerDown(target, { clientY: 700, pointerId: 2, pointerType: 'touch' })
      fireEvent.pointerMove(target, { clientY: 400, pointerId: 2, pointerType: 'touch' })
      fireEvent.pointerUp(target, { clientY: 400, pointerId: 2, pointerType: 'touch' })

      expect(onComplete).not.toHaveBeenCalled()
    },
  )

  it('keeps fine-pointer surface drags disabled while the swipe button still works', async () => {
    setCoarsePointer(false)
    const { onComplete } = renderEntry({
      homeContent: <div data-testid="home-surface">首页内容</div>,
    })
    const surface = screen.getByTestId('home-surface')

    fireEvent.pointerDown(surface, { clientY: 700, pointerId: 1, pointerType: 'mouse' })
    fireEvent.pointerMove(surface, { clientY: 400, pointerId: 1, pointerType: 'mouse' })
    fireEvent.pointerUp(surface, { clientY: 400, pointerId: 1, pointerType: 'mouse' })
    expect(onComplete).not.toHaveBeenCalled()

    const entry = screen.getByRole('button', { name: '上滑了解高歌集团' })
    fireEvent.pointerDown(entry, { clientY: 700, pointerId: 2, pointerType: 'mouse' })
    fireEvent.pointerMove(entry, { clientY: 430, pointerId: 2, pointerType: 'mouse' })
    fireEvent.pointerUp(entry, { clientY: 430, pointerId: 2, pointerType: 'mouse' })

    await vi.waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1))
  })

  it('queues one entry intent until the real group page is ready', async () => {
    let finishPreparation: ((ready: boolean) => void) | undefined
    const onPrepareGroup = vi.fn(
      () => new Promise<boolean>((resolve) => (finishPreparation = resolve)),
    )
    const onComplete = vi.fn()
    const view = renderEntry({ groupReady: false, onComplete, onPrepareGroup })

    fireEvent.click(screen.getByRole('button', { name: '上滑了解高歌集团' }))
    expect(onPrepareGroup).toHaveBeenCalledTimes(1)
    expect(onComplete).not.toHaveBeenCalled()

    view.rerender(
      <GroupSwipeEntry
        disabled={false}
        groupContent={<div data-testid="real-group">真实集团页</div>}
        groupReady
        homeContent={<div>首页内容</div>}
        mode="home"
        onComplete={onComplete}
        onPrepareGroup={onPrepareGroup}
      />,
    )
    finishPreparation?.(true)

    await vi.waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1))
  })

  it('returns control after group loading fails', async () => {
    const onPrepareGroup = vi.fn().mockResolvedValue(false)
    const { onComplete } = renderEntry({ groupReady: false, onPrepareGroup })
    const entry = screen.getByRole('button', { name: '上滑了解高歌集团' })

    fireEvent.click(entry)
    await vi.waitFor(() => expect(onPrepareGroup).toHaveBeenCalledTimes(1))

    expect(onComplete).not.toHaveBeenCalled()
    expect(entry).toBeEnabled()
  })

  it('resets the scene before paint when browser history returns home', () => {
    const groupContent = <div data-testid="real-group">真实集团页</div>
    const onComplete = vi.fn()
    const onPrepareGroup = vi.fn().mockResolvedValue(true)
    const view = renderEntry({ groupContent, mode: 'group', onComplete, onPrepareGroup })

    view.rerender(
      <GroupSwipeEntry
        disabled={false}
        groupContent={groupContent}
        groupReady
        homeContent={<div>首页内容</div>}
        mode="home"
        onComplete={onComplete}
        onPrepareGroup={onPrepareGroup}
      />,
    )

    expect(screen.getByTestId('group-swipe-scene')).toHaveAttribute('data-mode', 'home')
    expect(screen.getByRole('button', { name: '上滑了解高歌集团' })).toBeEnabled()
    expect(window.scrollTo).toHaveBeenCalledWith({ left: 0, top: 0 })
  })

  it('commits an intentional upward drag', async () => {
    const { onComplete } = renderEntry()
    const entry = screen.getByRole('button', { name: '上滑了解高歌集团' })

    fireEvent.pointerDown(entry, { clientY: 700, pointerId: 1 })
    fireEvent.pointerMove(entry, { clientY: 430, pointerId: 1 })
    fireEvent.pointerUp(entry, { clientY: 430, pointerId: 1 })

    await vi.waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1))
  })

  it('includes the release position when deciding whether to commit', async () => {
    const { onComplete } = renderEntry()
    const entry = screen.getByRole('button', { name: '上滑了解高歌集团' })

    fireEvent.pointerDown(entry, { clientY: 700, pointerId: 1 })
    fireEvent.pointerMove(entry, { clientY: 660, pointerId: 1 })
    fireEvent.pointerUp(entry, { clientY: 400, pointerId: 1 })

    await vi.waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1))
  })

  it('commits a short fast flick but not the same movement after a hold', async () => {
    const fast = renderEntry()
    const fastEntry = screen.getByRole('button', { name: '上滑了解高歌集团' })

    fireEvent.pointerDown(fastEntry, { clientY: 700, pointerId: 1 })
    await new Promise((resolve) => setTimeout(resolve, 10))
    fireEvent.pointerMove(fastEntry, { clientY: 610, pointerId: 1 })
    await new Promise((resolve) => setTimeout(resolve, 10))
    fireEvent.pointerUp(fastEntry, { clientY: 610, pointerId: 1 })
    await vi.waitFor(() => expect(fast.onComplete).toHaveBeenCalledTimes(1))

    fast.unmount()
    const held = renderEntry()
    const heldEntry = screen.getByRole('button', { name: '上滑了解高歌集团' })
    fireEvent.pointerDown(heldEntry, { clientY: 700, pointerId: 2 })
    fireEvent.pointerMove(heldEntry, { clientY: 610, pointerId: 2 })
    await new Promise((resolve) => setTimeout(resolve, 100))
    fireEvent.pointerUp(heldEntry, { clientY: 610, pointerId: 2 })

    expect(held.onComplete).not.toHaveBeenCalled()
  })

  it('cancels short and downward drags', () => {
    const { onComplete } = renderEntry()
    const entry = screen.getByRole('button', { name: '上滑了解高歌集团' })

    fireEvent.pointerDown(entry, { clientY: 700, pointerId: 2 })
    fireEvent.pointerMove(entry, { clientY: 660, pointerId: 2 })
    fireEvent.pointerUp(entry, { clientY: 660, pointerId: 2 })
    fireEvent.pointerDown(entry, { clientY: 600, pointerId: 3 })
    fireEvent.pointerMove(entry, { clientY: 740, pointerId: 3 })
    fireEvent.pointerUp(entry, { clientY: 740, pointerId: 3 })

    expect(onComplete).not.toHaveBeenCalled()
  })

  it('keeps the first pointer in control when another pointer touches the entry', async () => {
    const { onComplete } = renderEntry()
    const entry = screen.getByRole('button', { name: '上滑了解高歌集团' })

    fireEvent.pointerDown(entry, { clientY: 700, pointerId: 1 })
    fireEvent.pointerDown(entry, { clientY: 200, pointerId: 2 })
    fireEvent.pointerMove(entry, { clientY: 430, pointerId: 1 })
    fireEvent.pointerUp(entry, { clientY: 430, pointerId: 1 })

    await vi.waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1))
  })

  it('requires accumulated wheel intent', async () => {
    const { onComplete } = renderEntry()
    const viewport = screen.getByTestId('group-swipe-viewport')

    fireEvent.wheel(viewport, { deltaY: 40 })
    expect(onComplete).not.toHaveBeenCalled()

    fireEvent.wheel(viewport, { deltaY: 150 })
    await vi.waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1))
  })

  it('ignores wheel and pointer input while disabled', () => {
    const { onComplete } = renderEntry({ disabled: true })
    const viewport = screen.getByTestId('group-swipe-viewport')
    const entry = screen.getByRole('button', { name: '上滑了解高歌集团' })

    fireEvent.wheel(viewport, { deltaY: 240 })
    fireEvent.pointerDown(entry, { clientY: 700, pointerId: 3 })
    fireEvent.pointerMove(entry, { clientY: 300, pointerId: 3 })
    fireEvent.pointerUp(entry, { clientY: 300, pointerId: 3 })

    expect(onComplete).not.toHaveBeenCalled()
  })

  it('lets a drag take ownership from a pending wheel reset', async () => {
    const { onComplete } = renderEntry()
    const viewport = screen.getByTestId('group-swipe-viewport')
    const entry = screen.getByRole('button', { name: '上滑了解高歌集团' })

    fireEvent.wheel(viewport, { deltaY: 40 })
    fireEvent.pointerDown(entry, { clientY: 700, pointerId: 1 })
    fireEvent.pointerMove(entry, { clientY: 430, pointerId: 1 })
    await new Promise((resolve) => setTimeout(resolve, 170))
    fireEvent.pointerUp(entry, { clientY: 430, pointerId: 1 })

    await vi.waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1))
  })

  it('does not let pointer cancellation swallow the next click', async () => {
    const { onComplete } = renderEntry()
    const entry = screen.getByRole('button', { name: '上滑了解高歌集团' })

    fireEvent.pointerDown(entry, { clientY: 700, pointerId: 1 })
    fireEvent.pointerMove(entry, { clientY: 640, pointerId: 1 })
    fireEvent.pointerCancel(entry, { clientY: 640, pointerId: 1 })
    fireEvent.click(entry)

    await vi.waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1))
  })

  it('ignores wheel input that starts on an interactive target', () => {
    const { onComplete } = renderEntry()

    fireEvent.wheel(screen.getByRole('button', { name: '上滑了解高歌集团' }), { deltaY: 240 })

    expect(onComplete).not.toHaveBeenCalled()
  })

  it('only completes once when activated repeatedly', async () => {
    const { onComplete } = renderEntry()
    const entry = screen.getByRole('button', { name: '上滑了解高歌集团' })

    fireEvent.click(entry)
    fireEvent.click(entry)

    await vi.waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1))
  })

  it('keeps the button available without mounting the group layer with reduced motion', async () => {
    reducedMotion = true
    const onPrepareGroup = vi.fn().mockResolvedValue(true)
    const { onComplete } = renderEntry({ groupReady: false, onPrepareGroup })
    const entry = screen.getByRole('button', { name: '上滑了解高歌集团' })

    expect(screen.queryByTestId('group-swipe-group-layer')).not.toBeInTheDocument()
    fireEvent.pointerDown(entry, { clientY: 700, pointerId: 1 })
    fireEvent.pointerMove(entry, { clientY: 300, pointerId: 1 })
    fireEvent.pointerUp(entry, { clientY: 300, pointerId: 1 })
    fireEvent.wheel(screen.getByTestId('group-swipe-viewport'), { deltaY: 240 })
    expect(onComplete).not.toHaveBeenCalled()

    fireEvent.click(entry)
    await vi.waitFor(() => expect(onPrepareGroup).toHaveBeenCalledTimes(1))
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('does not complete a pending transition after the homepage unmounts', async () => {
    deferAnimations = true
    const { onComplete, unmount } = renderEntry()

    fireEvent.click(screen.getByRole('button', { name: '上滑了解高歌集团' }))
    unmount()
    finishDeferredAnimations.forEach((finish) => finish())
    await Promise.resolve()

    expect(onComplete).not.toHaveBeenCalled()
  })

  it('ignores a late preparation result after unmount', async () => {
    let finishPreparation: ((ready: boolean) => void) | undefined
    const onPrepareGroup = vi.fn(
      () => new Promise<boolean>((resolve) => (finishPreparation = resolve)),
    )
    const { onComplete, unmount } = renderEntry({ groupReady: false, onPrepareGroup })

    fireEvent.click(screen.getByRole('button', { name: '上滑了解高歌集团' }))
    unmount()
    finishPreparation?.(true)
    await Promise.resolve()

    expect(onComplete).not.toHaveBeenCalled()
  })
})
