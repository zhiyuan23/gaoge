/**
 * 简单节流函数 - 第一次立即执行，之后 delay 时间内只执行一次
 * @param fn 要节流的函数
 * @param delay 节流间隔（毫秒），默认 800ms
 * @returns 节流后的函数
 */
export function throttle<T extends any[]>(
  fn: (...args: T) => any,
  delay = 800,
): (...args: T) => void {
  let timer: number | null = null

  return (...args: T) => {
    if (timer) return

    timer = setTimeout(() => {
      timer = null
    }, delay) as any

    fn(...args)
  }
}

/**
 * 带选项的节流函数（更灵活版本）
 */
export function throttleWithOptions<T extends any[]>(
  fn: (...args: T) => any,
  delay = 800,
  options: { leading?: boolean; trailing?: boolean } = {},
) {
  const { leading = true, trailing = false } = options
  let timer: number | null = null
  let lastArgs: T | null = null

  return (...args: T) => {
    if (!timer && leading) {
      fn(...args)
    }

    lastArgs = args

    if (timer) return

    timer = setTimeout(() => {
      if (trailing && lastArgs) {
        fn(...lastArgs)
      }
      timer = null
      lastArgs = null
    }, delay) as any
  }
}

/**
 * 延迟执行（返回 Promise）
 */
export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
