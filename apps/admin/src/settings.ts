import { cloneDeep } from 'es-toolkit'

import settingsDefault from '@/settings.default'
import { merge } from '@/utils/object'

import type { RecursiveRequired, Settings } from '#/global'

const globalSettings: Settings.all = {
  app: {
    enablePermission: true,
    enableDynamicTitle: true,
    routeBaseOn: 'backend',
  },
  layout: {
    enableMobileAdaptation: true,
  },
  menu: {
    mode: 'head',
    enableSubMenuCollapseButton: true,
    enableHotkeys: true,
  },
  topbar: {
    mode: 'fixed',
  },
  tabbar: {
    enable: true,
    enableIcon: true,
    enableHotkeys: true,
  },
  toolbar: {
    fullscreen: true,
    pageReload: true,
    colorScheme: true,
  },
  mainPage: {
    enableHotkeys: true,
  },
  copyright: {
    enable: false,
    dates: '',
    company: '高歌数字',
    website: '',
  },
}

export default merge(globalSettings, cloneDeep(settingsDefault)) as RecursiveRequired<Settings.all>
