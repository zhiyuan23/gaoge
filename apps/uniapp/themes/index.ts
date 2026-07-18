import { hex2rgba } from '@unocss/preset-mini/utils'

export const lightTheme = {
  // 颜色主题
  'color-scheme': 'light',

  // 主题色配置
  '--primary': '#007E41',
  '--primary-tint': '#d1eeda',
  '--primary-text': '#ffffff',

  // 系列主题色
  '--theme-zwcs': '#7FBE26',
  '--theme-zbqr': '#7FBE26',
  '--theme-ml': '#7FBE26',
  '--text-theme': '#F77600',

  // 微信主题色
  '--wechat-primary': '#07C160',
  '--wechat-primary-tint': '#D2F5E3',
  '--wechat-primary-text': '#ffffff',

  // 文字颜色
  '--text-primary': '#353535', // 主文字颜色
  '--text-secondary': '#909399', // 副文字颜色
  '--text-disabled': '#C8C9CC', // 禁用状态文字颜色

  // 背景色
  '--bg-page': '#f5f5f5', // 页面背景
  '--bg-container': '#ffffff', // 容器背景
  '--bg-secondary': '#F3F4F6', // 次要背景
  '--bg-disabled': '#f7f8fa', // 禁用状态背景

  // 边框与分割线
  '--border-base': '#E6E6E6', // 基础边框
  '--border-light': '#EBEDF0', // 浅色边框
  '--divider': '#f2f2f2', // 分割线颜色

  // 状态色
  '--success': '#52c41a',
  '--warning': '#faad14',
  '--danger': '#f5222d',
  '--info': '#1890ff',

  // 导航栏
  '--navbar-bg': '#ffffff',
  '--navbar-text': '#353535',

  // 标签栏
  '--tabbar-bg': '#ffffff',
  '--tabbar-text': '#878787',
  '--tabbar-active-text': '#007E41',

  // 内置 UI 组件 (使用主题色)
  '--ui-primary': hex2rgba('#007E41')!.join(' '),
  '--ui-text': hex2rgba('#ffffff')!.join(' '),
}

export const darkTheme = {
  // 颜色主题
  'color-scheme': 'dark',

  // 主题色配置
  '--primary': '#00C456',
  '--primary-secondary': '#007E41',
  '--primary-text': '#ffffff',

  // 系列主题色
  '--theme-zwcs': '#7FBE26',
  '--theme-zbqr': '#7FBE26',
  '--theme-ml': '#7FBE26',
  '--text-theme': '#F77600',

  // 微信主题色
  '--wechat-primary': '#0DBF5B',
  '--wechat-primary-tint': '#083C2A',
  '--wechat-primary-text': '#ffffff',

  // 文字颜色
  '--text-primary': '#E0E0E0',
  '--text-secondary': '#A0A0A0',
  '--text-disabled': '#5A5A5A',

  // 背景色
  '--bg-page': '#121212',
  '--bg-container': '#1E1E1E',
  '--bg-secondary': '#2A2A2A',
  '--bg-disabled': '#333333',

  // 边框与分割线
  '--border-base': '#3A3A3A',
  '--border-light': '#2D2D2D',
  '--divider': '#252525',

  // 状态色
  '--success': '#5BD18B',
  '--warning': '#FFC55A',
  '--danger': '#FF6B6B',
  '--info': '#5AA9FF',

  // 导航栏
  '--navbar-bg': '#1A1A1A',
  '--navbar-text': '#E0E0E0',

  // 标签栏
  '--tabbar-bg': '#1A1A1A',
  '--tabbar-text': '#A0A0A0',
  '--tabbar-active-text': '#00C456',

  // 内置 UI 组件
  '--ui-primary': hex2rgba('#00C456')!.join(' '),
  '--ui-text': hex2rgba('#ffffff')!.join(' '),
}
