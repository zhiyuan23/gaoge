import type { VNodeChild } from 'vue'

declare global {
  type VueNode = VNodeChild | JSX.Element
  type TimeoutHandle = ReturnType<typeof setTimeout>
  type IntervalHandle = ReturnType<typeof setInterval>

  interface Uni {
    $u: any
  }
}
