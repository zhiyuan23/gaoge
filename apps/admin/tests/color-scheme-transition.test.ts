import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const componentSource = readFileSync(
  'apps/admin/src/layouts/components/Topbar/Toolbar/ColorScheme/index.vue',
  'utf8',
)
const globalStyles = readFileSync('apps/admin/src/assets/styles/globals.css', 'utf8')

test('anchors both theme transition directions to the theme button', () => {
  assert.match(componentSource, /event\.currentTarget as HTMLElement/)
  assert.match(componentSource, /target\.getBoundingClientRect\(\)/)
  assert.match(componentSource, /const x = left \+ width \/ 2/)
  assert.match(componentSource, /const y = top \+ height \/ 2/)
  assert.match(componentSource, /const ratioX = \(100 \* x\) \/ innerWidth/)
  assert.match(componentSource, /const ratioY = \(100 \* y\) \/ innerHeight/)
  assert.match(
    componentSource,
    /const referRadius = Math\.hypot\(innerWidth, innerHeight\) \/ Math\.SQRT2/,
  )
  assert.match(componentSource, /const ratioRadius = \(100 \* endRadius\) \/ referRadius/)
  assert.match(componentSource, /`circle\(0% at \$\{ratioX\}% \$\{ratioY\}%\)`/)
  assert.match(componentSource, /`circle\(\$\{ratioRadius\}% at \$\{ratioX\}% \$\{ratioY\}%\)`/)
  assert.match(componentSource, /await nextTick\(\)/)
  assert.match(componentSource, /isDark \? '::view-transition-old\(root\)'/)
  assert.match(componentSource, /: '::view-transition-new\(root\)'/)
})

test('protects both snapshots only while entering light mode', () => {
  assert.match(componentSource, /const isTransitioning = ref\(false\)/)
  assert.match(
    componentSource,
    /if \(!settingsStore\.currentColorScheme \|\| isTransitioning\.value\)/,
  )
  assert.match(componentSource, /isTransitioning\.value = true/)
  assert.match(componentSource, /isTransitioning\.value = false/)
  assert.match(componentSource, /if \(!isDark\)/)
  assert.match(
    componentSource,
    /root\.style\.setProperty\('--theme-transition-x', `\$\{ratioX\}%`\)/,
  )
  assert.match(
    componentSource,
    /root\.style\.setProperty\('--theme-transition-y', `\$\{ratioY\}%`\)/,
  )
  assert.match(componentSource, /root\.classList\.add\('theme-transition-to-light'\)/)
  assert.match(componentSource, /let themeTransitionSequence = 0/)
  assert.match(componentSource, /const transitionSequence = \+\+themeTransitionSequence/)
  assert.match(
    componentSource,
    /if \(transitionSequence !== themeTransitionSequence\) \{\s+return\s+\}/,
  )
  assert.match(
    componentSource,
    /const cleanupCurrentLightTransition = \(\) => cleanupLightTransition\(transitionSequence\)/,
  )
  assert.match(
    componentSource,
    /cleanupCurrentLightTransition\(\)\s+isTransitioning\.value = true\s+if \(!isDark\)/,
  )
  assert.match(
    componentSource,
    /if \(!transition\) \{\s+cleanupCurrentLightTransition\(\)\s+return\s+\}/,
  )
  assert.match(
    componentSource,
    /try \{\s+transition = startViewTransition\(\)\s+\}\s+catch \{\s+cleanupCurrentLightTransition\(\)\s+return\s+\}/,
  )
  assert.match(componentSource, /\.catch\(cleanupCurrentLightTransition\)/)
  assert.match(componentSource, /transition\.finished\.finally\(cleanupCurrentLightTransition\)/)
  assert.match(componentSource, /root\.classList\.remove\('theme-transition-to-light'\)/)
  assert.match(componentSource, /root\.style\.removeProperty\('--theme-transition-x'\)/)
  assert.match(componentSource, /root\.style\.removeProperty\('--theme-transition-y'\)/)
  assert.match(globalStyles, /theme-transition-to-light::view-transition-new\(root\)/)
  assert.match(
    globalStyles,
    /clip-path: circle\(0 at var\(--theme-transition-x\) var\(--theme-transition-y\)\)/,
  )
  assert.doesNotMatch(globalStyles, /theme-transition-to-dark/)
  assert.match(globalStyles, /theme-transition-to-light::view-transition-old\(root\)/)
  assert.match(globalStyles, /clip-path: none !important/)
})
