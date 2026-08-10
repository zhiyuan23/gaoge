import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0C0C0C',
        mist: '#D7E2EA',
        primary: '#DEDBC8',
      },
      fontFamily: {
        'display-cn': [
          'Kanit',
          '"Source Han Sans CN Variable"',
          '"Source Han Sans CN"',
          '"Noto Sans SC"',
          '"PingFang SC"',
          '"Hiragino Sans GB"',
          '"Microsoft YaHei"',
          'system-ui',
          'sans-serif',
        ],
        kanit: ['Kanit', 'sans-serif'],
        readex: ['Readex Pro', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['"Instrument Serif"', 'serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
