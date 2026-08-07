import type { Settings } from '#/global'

type MenuMode = NonNullable<Settings.menu['mode']>

export function resolveSubSidebarTransitionName(
  mode: MenuMode,
  activeIndex: number,
  previousActiveIndex: number,
  isMobile: boolean,
) {
  const axis = isMobile || mode === 'side' || mode === 'single' ? 'y' : 'x'
  const direction = activeIndex > previousActiveIndex ? 'start' : 'end'
  return `sub-sidebar-${axis}-${direction}`
}
