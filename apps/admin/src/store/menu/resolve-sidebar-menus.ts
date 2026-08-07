import type { Menu, Settings } from '#/global'

type MenuMode = NonNullable<Settings.menu['mode']>

interface HeadSidebarPanel {
  key: number
  menu: Menu.recordRaw[]
  visible: boolean
}

interface SubSidebarPanel {
  key: string
  menu: Menu.recordRaw[]
  render: boolean
  visible: boolean
}

function removeLeadingMenuLevel(menus: Menu.recordRaw[]): Menu.recordRaw[] {
  return menus.flatMap((menu) => (menu.children?.length ? menu.children : [menu]))
}

export function resolveSidebarMenus(
  allMenus: Menu.recordMainRaw[],
  mode: MenuMode,
  activeIndex: number,
  hideFirstLevel = false,
): Menu.recordRaw[] {
  if (mode === 'single') {
    return hideFirstLevel ? removeLeadingMenuLevel(allMenus) : allMenus
  }

  const activeMenu = allMenus.length > 1 ? allMenus[activeIndex] : allMenus[0]
  return activeMenu?.children ?? []
}

export function resolveHeadSidebarPanels(
  allMenus: Menu.recordMainRaw[],
  activeIndex: number,
): HeadSidebarPanel[] {
  const visibleIndex = allMenus.length === 1 ? 0 : activeIndex
  return allMenus.map((menu, index) => ({
    key: index,
    menu: menu.children,
    visible: index === visibleIndex,
  }))
}

export function resolveSubSidebarPanels(
  allMenus: Menu.recordMainRaw[],
  projectedMenu: Menu.recordRaw[],
  mode: MenuMode,
  activeIndex: number,
): SubSidebarPanel[] {
  const isHeadMode = mode === 'head'
  const headPanels = resolveHeadSidebarPanels(allMenus, activeIndex).map((panel) => ({
    key: `head-${panel.key}`,
    menu: panel.menu,
    render: isHeadMode,
    visible: isHeadMode && panel.visible,
  }))

  return [
    ...headPanels,
    {
      key: 'projected',
      menu: projectedMenu,
      render: !isHeadMode,
      visible: !isHeadMode,
    },
  ]
}
