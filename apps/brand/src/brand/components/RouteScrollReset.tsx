import { useEffect, useLayoutEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

export default function RouteScrollReset() {
  const location = useLocation()
  const navigationType = useNavigationType()
  const positions = useRef(new Map<string, number>())
  const previousPathname = useRef(location.pathname)

  useEffect(() => {
    let isLeaving = false

    const rememberPosition = () => {
      if (isLeaving) return
      positions.current.set(location.key, window.scrollY)
    }

    const rememberBeforeNavigation = (event: MouseEvent) => {
      if (
        event.button !== 0 ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        !(event.target instanceof Element)
      ) {
        return
      }

      const link = event.target.closest<HTMLAnchorElement>('a[href]')

      if (!link || link.target === '_blank' || link.hasAttribute('download')) return

      const destination = new URL(link.href)

      if (
        destination.origin === window.location.origin &&
        destination.pathname !== window.location.pathname
      ) {
        rememberPosition()
        isLeaving = true
      }
    }

    rememberPosition()
    window.addEventListener('scroll', rememberPosition, { passive: true })
    document.addEventListener('click', rememberBeforeNavigation, true)

    return () => {
      window.removeEventListener('scroll', rememberPosition)
      document.removeEventListener('click', rememberBeforeNavigation, true)
    }
  }, [location.key])

  useLayoutEffect(() => {
    const pathnameChanged = previousPathname.current !== location.pathname
    let restoreFrame: number | undefined

    if (pathnameChanged) {
      const top = navigationType === 'POP' ? (positions.current.get(location.key) ?? 0) : 0

      if (navigationType === 'POP') {
        restoreFrame = window.requestAnimationFrame(() => {
          window.scrollTo({ left: 0, top })
        })
      } else {
        window.scrollTo({ left: 0, top })
      }
    }

    previousPathname.current = location.pathname

    return () => {
      if (restoreFrame !== undefined) window.cancelAnimationFrame(restoreFrame)
    }
  }, [location.key, location.pathname, navigationType])

  return null
}
