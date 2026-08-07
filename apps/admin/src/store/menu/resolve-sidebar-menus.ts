import type { Menu, Settings } from '#/global'

type MenuMode = NonNullable<Settings.menu['mode']>

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
