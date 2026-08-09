import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion'
import {
  forwardRef,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from 'react'

import {
  getGroupGestureProfile,
  getUpwardVelocity,
  getWheelCommitDistance,
  type GroupGestureProfile,
  normalizeWheelDelta,
  type PointerSample,
  rubberband,
  shouldEnterGroup,
} from '@/concepts/skiing/groupTransition'

export interface GroupSwipeEntryHandle {
  enterGroup(): void
}

interface GroupSwipeEntryProps {
  readonly disabled: boolean
  readonly groupContent: ReactNode | null
  readonly groupReady: boolean
  readonly homeContent: ReactNode
  readonly mode: 'group' | 'home'
  readonly onComplete: () => void
  readonly onPrepareGroup: () => Promise<boolean>
}

const MAX_UNREADY_REVEAL = 32
const WHEEL_IDLE_DELAY = 140
const INTERACTIVE_POINTER_TARGET =
  'a, button, dialog, input, select, textarea, [contenteditable], [data-group-transition-ignore]'

function viewportHeight() {
  return Math.max(window.innerHeight, 1)
}

function isSwipeControl(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest('[data-group-swipe-control]'))
}

function blocksPageGesture(target: EventTarget | null) {
  if (!(target instanceof Element) || isSwipeControl(target)) return false
  return Boolean(target.closest(INTERACTIVE_POINTER_TARGET))
}

function hasCoarsePointer(event: ReactPointerEvent<HTMLDivElement>) {
  return event.pointerType === 'touch' || window.matchMedia('(pointer: coarse)').matches
}

const GroupSwipeEntry = forwardRef<GroupSwipeEntryHandle, GroupSwipeEntryProps>(
  function GroupSwipeEntry(
    { disabled, groupContent, groupReady, homeContent, mode, onComplete, onPrepareGroup },
    ref,
  ) {
    const reducedMotion = useReducedMotion()
    const groupLayerRef = useRef<HTMLDivElement>(null)
    const viewportRef = useRef<HTMLDivElement>(null)
    const pointerIdRef = useRef<number | null>(null)
    const pointerStartRef = useRef(0)
    const pointerSamplesRef = useRef<PointerSample[]>([])
    const pointerProfileRef = useRef<GroupGestureProfile>(getGroupGestureProfile('desktop'))
    const pointerStartedOnControlRef = useRef(false)
    const didDragRef = useRef(false)
    const suppressClickRef = useRef(false)
    const wheelDistanceRef = useRef(0)
    const wheelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const animationRef = useRef<ReturnType<typeof animate> | null>(null)
    const animationSequenceRef = useRef(0)
    const preparationSequenceRef = useRef(0)
    const navigatingRef = useRef(false)
    const preparingRef = useRef(false)
    const previousModeRef = useRef(mode)
    const groupReadyRef = useRef(groupReady)
    const onCompleteRef = useRef(onComplete)
    const onPrepareGroupRef = useRef(onPrepareGroup)
    const offsetY = useMotionValue(0)
    const homeTransform = useTransform(offsetY, (value) => `translate3d(0, ${value}px, 0)`)
    const groupTransform = useTransform(
      offsetY,
      (value) => `translate3d(0, calc(100dvh + ${value}px), 0)`,
    )

    useEffect(() => {
      groupReadyRef.current = groupReady
    }, [groupReady])

    useEffect(() => {
      onCompleteRef.current = onComplete
    }, [onComplete])

    useEffect(() => {
      onPrepareGroupRef.current = onPrepareGroup
    }, [onPrepareGroup])

    const stopAnimation = useCallback(() => {
      animationSequenceRef.current += 1
      animationRef.current?.stop()
      animationRef.current = null
    }, [])

    const clearWheelInput = useCallback(() => {
      wheelDistanceRef.current = 0
      if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current)
      wheelTimerRef.current = null
    }, [])

    const settleHome = useCallback(() => {
      if (navigatingRef.current || reducedMotion) {
        offsetY.set(0)
        return
      }

      stopAnimation()
      const sequence = animationSequenceRef.current
      const controls = animate(offsetY, 0, {
        bounce: 0,
        duration: 0.36,
        type: 'spring',
      })
      animationRef.current = controls
      void controls.then(() => {
        if (sequence === animationSequenceRef.current) animationRef.current = null
      })
    }, [offsetY, reducedMotion, stopAnimation])

    const enterPreparedGroup = useCallback(
      (velocity = 0) => {
        if (disabled || navigatingRef.current || mode !== 'home') return

        navigatingRef.current = true
        clearWheelInput()

        if (reducedMotion) {
          onCompleteRef.current()
          return
        }

        stopAnimation()
        navigatingRef.current = true
        const sequence = animationSequenceRef.current
        const controls = animate(offsetY, -viewportHeight(), {
          bounce: velocity > 0 ? 0.12 : 0,
          duration: velocity > 0 ? 0.4 : 0.36,
          type: 'spring',
          velocity: -velocity,
        })
        animationRef.current = controls
        void controls.then(() => {
          if (sequence !== animationSequenceRef.current) return
          animationRef.current = null
          onCompleteRef.current()
        })
      },
      [clearWheelInput, disabled, mode, offsetY, reducedMotion, stopAnimation],
    )

    const enterGroup = useCallback(
      (velocity = 0) => {
        if (disabled || navigatingRef.current || preparingRef.current || mode !== 'home') return

        if (groupReadyRef.current) {
          enterPreparedGroup(velocity)
          return
        }

        preparingRef.current = true
        const sequence = preparationSequenceRef.current
        void onPrepareGroupRef.current().then(
          (ready) => {
            if (sequence !== preparationSequenceRef.current) return
            preparingRef.current = false
            if (ready) {
              enterPreparedGroup(velocity)
            } else {
              navigatingRef.current = false
              settleHome()
            }
          },
          () => {
            if (sequence !== preparationSequenceRef.current) return
            preparingRef.current = false
            navigatingRef.current = false
            settleHome()
          },
        )
      },
      [disabled, enterPreparedGroup, mode, settleHome],
    )

    useImperativeHandle(ref, () => ({ enterGroup }), [enterGroup])

    useLayoutEffect(() => {
      const groupLayer = groupLayerRef.current
      if (groupLayer) {
        if (mode === 'home') groupLayer.setAttribute('inert', '')
        else groupLayer.removeAttribute('inert')
      }
    }, [mode])

    useLayoutEffect(() => {
      const previousMode = previousModeRef.current
      previousModeRef.current = mode
      if (previousMode === mode) return

      stopAnimation()
      offsetY.set(0)
      window.scrollTo({ left: 0, top: 0 })

      if (mode === 'home') {
        preparationSequenceRef.current += 1
        navigatingRef.current = false
        preparingRef.current = false
      }
    }, [mode, offsetY, stopAnimation])

    useEffect(() => {
      const viewport = viewportRef.current
      if (!viewport || disabled || reducedMotion || mode !== 'home') return

      function handleWheel(event: WheelEvent) {
        if (navigatingRef.current || preparingRef.current || event.deltaY === 0) return

        const target = event.target
        if (
          target instanceof Element &&
          target.closest('a, button, dialog, [data-group-transition-ignore]')
        ) {
          return
        }

        event.preventDefault()
        stopAnimation()
        const commitDistance = getWheelCommitDistance(viewportHeight())
        const normalizedDelta = normalizeWheelDelta(event.deltaY, event.deltaMode, viewportHeight())
        wheelDistanceRef.current = Math.max(
          0,
          Math.min(commitDistance, wheelDistanceRef.current + normalizedDelta),
        )
        const visibleDistance = groupReadyRef.current
          ? wheelDistanceRef.current
          : Math.min(rubberband(wheelDistanceRef.current, viewportHeight()), MAX_UNREADY_REVEAL)
        offsetY.set(-visibleDistance)

        if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current)

        if (wheelDistanceRef.current >= commitDistance) {
          enterGroup()
          return
        }

        wheelTimerRef.current = setTimeout(() => {
          wheelDistanceRef.current = 0
          settleHome()
        }, WHEEL_IDLE_DELAY)
      }

      viewport.addEventListener('wheel', handleWheel, { passive: false })
      return () => viewport.removeEventListener('wheel', handleWheel)
    }, [disabled, enterGroup, mode, offsetY, reducedMotion, settleHome, stopAnimation])

    useEffect(() => {
      if (disabled && !navigatingRef.current) {
        clearWheelInput()
        settleHome()
      }
    }, [clearWheelInput, disabled, settleHome])

    useEffect(
      () => () => {
        preparationSequenceRef.current += 1
        animationSequenceRef.current += 1
        animationRef.current?.stop()
        if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current)
      },
      [],
    )

    function setDragOffset(distance: number) {
      if (distance < 0) {
        offsetY.set(rubberband(-distance, viewportHeight()))
        return
      }

      const visibleDistance = groupReadyRef.current
        ? Math.min(distance, viewportHeight())
        : Math.min(rubberband(distance, viewportHeight()), MAX_UNREADY_REVEAL)
      offsetY.set(-visibleDistance)
    }

    function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
      if (
        disabled ||
        reducedMotion ||
        navigatingRef.current ||
        preparingRef.current ||
        pointerIdRef.current !== null
      ) {
        return
      }

      const coarsePointer = hasCoarsePointer(event)
      const startedOnControl = isSwipeControl(event.target)
      if ((!coarsePointer && !startedOnControl) || blocksPageGesture(event.target)) return

      clearWheelInput()
      stopAnimation()
      pointerProfileRef.current = getGroupGestureProfile(coarsePointer ? 'mobile' : 'desktop')
      pointerStartedOnControlRef.current = startedOnControl
      pointerIdRef.current = event.pointerId
      pointerStartRef.current = event.clientY
      pointerSamplesRef.current = [{ position: event.clientY, timestamp: event.timeStamp }]
      didDragRef.current = false
      event.currentTarget.setPointerCapture?.(event.pointerId)
    }

    function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
      if (pointerIdRef.current !== event.pointerId || disabled || reducedMotion) return

      const distance = pointerStartRef.current - event.clientY
      if (!didDragRef.current && Math.abs(distance) < pointerProfileRef.current.gestureThreshold) {
        return
      }

      didDragRef.current = true
      pointerSamplesRef.current = [
        ...pointerSamplesRef.current.slice(-4),
        { position: event.clientY, timestamp: event.timeStamp },
      ]
      setDragOffset(distance)
    }

    function finishPointer(event: ReactPointerEvent<HTMLDivElement>, cancelled = false) {
      if (pointerIdRef.current !== event.pointerId) return

      pointerIdRef.current = null
      event.currentTarget.releasePointerCapture?.(event.pointerId)
      suppressClickRef.current =
        pointerStartedOnControlRef.current && didDragRef.current && !cancelled
      pointerStartedOnControlRef.current = false

      if (!didDragRef.current || disabled || reducedMotion || cancelled) {
        if (cancelled) suppressClickRef.current = false
        if (didDragRef.current) settleHome()
        return
      }

      pointerSamplesRef.current = [
        ...pointerSamplesRef.current.slice(-4),
        { position: event.clientY, timestamp: event.timeStamp },
      ]
      const releaseDistance = pointerStartRef.current - event.clientY
      setDragOffset(releaseDistance)
      const distance = Math.max(0, releaseDistance)
      const velocity = Math.max(0, getUpwardVelocity(pointerSamplesRef.current))
      if (
        shouldEnterGroup(
          { distance, velocity, viewportHeight: viewportHeight() },
          pointerProfileRef.current,
        )
      ) {
        enterGroup(velocity)
      } else {
        settleHome()
      }
    }

    function handleClick() {
      if (suppressClickRef.current) {
        suppressClickRef.current = false
        return
      }

      enterGroup()
    }

    const entryControl = (
      <button
        aria-label="上滑了解高歌集团"
        className="group-swipe-entry absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-[15] flex min-h-11 min-w-11 -translate-x-1/2 touch-none items-center justify-center text-white/55"
        data-group-swipe-control
        disabled={disabled}
        onClick={handleClick}
        type="button"
      >
        <span aria-hidden="true" className="group-swipe-chevron" data-testid="group-swipe-chevron">
          <span />
          <span />
        </span>
      </button>
    )

    if (reducedMotion && mode === 'home') {
      return (
        <div
          className="group-swipe-viewport relative h-[100dvh] overflow-hidden bg-black"
          data-mode={mode}
          data-testid="group-swipe-viewport"
          onPointerCancel={(event) => finishPointer(event, true)}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishPointer}
          ref={viewportRef}
        >
          {homeContent}
          {entryControl}
        </div>
      )
    }

    return (
      <div
        className="group-swipe-viewport"
        data-mode={mode}
        data-testid="group-swipe-viewport"
        onPointerCancel={(event) => finishPointer(event, true)}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishPointer}
        ref={viewportRef}
      >
        <div className="group-swipe-scene" data-mode={mode} data-testid="group-swipe-scene">
          {mode === 'home' ? (
            <motion.div
              className="group-swipe-home-layer"
              data-testid="group-swipe-home-layer"
              key="home"
              style={{ transform: homeTransform }}
            >
              {homeContent}
              {entryControl}
            </motion.div>
          ) : null}
          <motion.div
            aria-hidden={mode === 'home' ? 'true' : undefined}
            className="group-swipe-group-layer"
            data-testid="group-swipe-group-layer"
            key="group"
            ref={groupLayerRef}
            {...(mode === 'home' ? { style: { transform: groupTransform } } : {})}
          >
            {groupContent}
          </motion.div>
        </div>
      </div>
    )
  },
)

export default GroupSwipeEntry
