import { entriesToCss, toArray } from '@unocss/core'
import { defineConfig, presetIcons, transformerDirectives, transformerVariantGroup } from 'unocss'
import { presetWeapp } from 'unocss-preset-weapp'
import { extractorAttributify, transformerClass } from 'unocss-preset-weapp/transformer'

import { darkTheme, lightTheme } from './themes'

const { presetWeappAttributify } = extractorAttributify()

const rpxPropsMap: Record<string, string[]> = {
  m: ['margin'],
  mx: ['margin-left', 'margin-right'],
  my: ['margin-top', 'margin-bottom'],
  ml: ['margin-left'],
  mr: ['margin-right'],
  mt: ['margin-top'],
  mb: ['margin-bottom'],
  p: ['padding'],
  px: ['padding-left', 'padding-right'],
  py: ['padding-top', 'padding-bottom'],
  pl: ['padding-left'],
  pr: ['padding-right'],
  pt: ['padding-top'],
  pb: ['padding-bottom'],
  gap: ['gap'],
  w: ['width'],
  h: ['height'],
  'min-w': ['min-width'],
  'max-w': ['max-width'],
  'min-h': ['min-height'],
  'max-h': ['max-height'],
  top: ['top'],
  right: ['right'],
  bottom: ['bottom'],
  left: ['left'],
  inset: ['top', 'right', 'bottom', 'left'],
  leading: ['line-height'],
  text: ['font-size'],
  rounded: ['border-radius'],
}

// 设置rpx为默认单位
const generateRpxRules = (map: Record<string, string[]>) => {
  const rules: any[] = []

  Object.entries(map).forEach(([prefix, props]) => {
    // 正数
    rules.push([
      new RegExp(`^${prefix}-(-?[\\d.]+)$`),
      (match: string[]) => Object.fromEntries(props.map((p) => [p, `${match[1]}rpx`])),
      { autocomplete: `${prefix}-<num>` },
    ])
    // 负数
    rules.push([
      new RegExp(`^-${prefix}-(-?[\\d.]+)$`),
      (match: string[]) => Object.fromEntries(props.map((p) => [p, `-${match[1]}rpx`])),
      { autocomplete: `-${prefix}-<num>` },
    ])
  })

  return rules
}

export default defineConfig({
  content: {
    filesystem: ['src/**/*.{vue,ts,js,html}'],
  },
  presets: [
    presetWeapp() as any,
    presetWeappAttributify() as any,
    presetIcons({
      scale: 1.2,
      warn: true,
      extraProperties: {
        display: 'inline-block',
        'vertical-align': 'middle',
      },
    }),
  ],
  /**
   * 自定义快捷语句
   * @see https://github.com/unocss/unocss#shortcuts
   */
  rules: [
    ...generateRpxRules(rpxPropsMap),

    // 边框
    [
      /^border-(\d+)-(solid|dashed|dotted)-(.+)$/,
      ([, w, style, color]) => ({
        'border-width': `${w}rpx`,
        'border-style': style,
        'border-color': color,
      }),
    ],
    // 单独设置边框的方向（如上下左右），例如 border-t-2-solid-#e0e0e0
    [
      /^border-([trblxy])-(\d+)-(solid|dashed|dotted)-(.+)$/,
      ([, direction, w, style, color]) => {
        const directions: Record<'t' | 'r' | 'b' | 'l' | 'x' | 'y', string> = {
          t: 'top',
          r: 'right',
          b: 'bottom',
          l: 'left',
          x: 'left right',
          y: 'top bottom',
        }
        const borderSide = directions[direction as keyof typeof directions]

        if (!borderSide) {
          return {}
        }

        return {
          [`border-${borderSide}-width`]: `${w}rpx`,
          [`border-${borderSide}-style`]: style,
          [`border-${borderSide}-color`]: color,
        }
      },
    ],
  ],
  shortcuts: [
    [
      /^flex-?(col)?-(start|end|center|baseline|stretch)-?(start|end|center|between|around|evenly|left|right)?$/,
      ([, col, items, justify]) => {
        return [
          'flex',
          col ? 'flex-col' : '',
          items ? `items-${items}` : '',
          justify ? `justify-${justify}` : '',
        ]
          .filter(Boolean)
          .join(' ')
      },
    ],
  ],
  theme: {
    colors: {
      primary: lightTheme['--primary'],
      primaryTint: lightTheme['--primary-tint'],
      default: lightTheme['--text-primary'],
      secondary: lightTheme['--text-secondary'],
      background: lightTheme['--bg-container'],
      bgSecondary: lightTheme['--bg-secondary'],
      border: lightTheme['--border-base'],
      wechat: lightTheme['--wechat-primary'],
      textTheme: lightTheme['--text-theme'],
    },
    fontSize: {
      xs: '22rpx',
      sm: '24rpx',
      base: '26rpx',
      lg: '30rpx',
      xl: '32rpx',
    },
    spacing: { row: { base: '20rpx' } },
  },
  preflights: [
    {
      getCSS: () => {
        const returnCss: string[] = []
        // 明亮主题
        const lightCss = entriesToCss(Object.entries(lightTheme))
        const lightRoots = toArray([`*,::before,::after`, `::backdrop`])
        returnCss.push(lightRoots.map((root: string) => `${root}{${lightCss}}`).join(''))
        // 暗黑主题
        const darkCss = entriesToCss(Object.entries(darkTheme))
        const darkRoots = toArray([
          `html.dark,html.dark *,html.dark ::before,html.dark ::after`,
          `html.dark ::backdrop`,
        ])
        returnCss.push(darkRoots.map((root: string) => `${root}{${darkCss}}`).join(''))

        return returnCss.join('')
      },
    },
  ],
  transformers: [
    // 启用 @apply 功能
    transformerDirectives({ enforce: 'pre' }),
    // 启用 () 分组功能
    transformerVariantGroup(),
    transformerClass(),
  ],
})
