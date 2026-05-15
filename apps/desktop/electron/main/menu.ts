import { APP_DISPLAY_NAME, APP_WEBSITE_URL } from './app-config'
import { Menu, type MenuItemConstructorOptions, shell } from './electron-runtime'

export { APP_DISPLAY_NAME } from './app-config'

export function buildAppMenuTemplate(
  platform: NodeJS.Platform = process.platform,
): MenuItemConstructorOptions[] {
  const appSubmenu: MenuItemConstructorOptions[] =
    platform === 'darwin'
      ? [
          { label: `关于${APP_DISPLAY_NAME}`, role: 'about' },
          { type: 'separator' },
          { label: '服务', role: 'services' },
          { type: 'separator' },
          { label: `隐藏${APP_DISPLAY_NAME}`, role: 'hide' },
          { label: '隐藏其他', role: 'hideOthers' },
          { label: '显示全部', role: 'unhide' },
          { type: 'separator' },
          { label: `退出${APP_DISPLAY_NAME}`, role: 'quit' },
        ]
      : [{ label: `退出${APP_DISPLAY_NAME}`, role: 'quit' }]

  return [
    {
      label: APP_DISPLAY_NAME,
      submenu: appSubmenu,
    },
    {
      label: '编辑',
      submenu: [
        { label: '撤销', role: 'undo' },
        { label: '重做', role: 'redo' },
        { type: 'separator' },
        { label: '剪切', role: 'cut' },
        { label: '复制', role: 'copy' },
        { label: '粘贴', role: 'paste' },
        { label: '全选', role: 'selectAll' },
      ],
    },
    {
      label: '视图',
      submenu: [
        { label: '重新加载', role: 'reload' },
        { label: '强制重新加载', role: 'forceReload' },
        { type: 'separator' },
        { label: '实际大小', role: 'resetZoom' },
        { label: '放大', role: 'zoomIn' },
        { label: '缩小', role: 'zoomOut' },
        { type: 'separator' },
        { label: '切换全屏', role: 'togglefullscreen' },
      ],
    },
    {
      label: '窗口',
      submenu: [
        { label: '最小化', role: 'minimize' },
        { label: '关闭窗口', role: 'close' },
      ],
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '访问高歌官网',
          click: () => {
            void shell.openExternal(APP_WEBSITE_URL)
          },
        },
      ],
    },
  ]
}

export function registerApplicationMenu() {
  Menu.setApplicationMenu(Menu.buildFromTemplate(buildAppMenuTemplate()))
}
