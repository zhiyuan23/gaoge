import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function resolveRoutePath(basePath?: string, routePath?: string) {
  const normalizedBasePath = normalizeRoutePath(basePath ?? '')
  const normalizedRoutePath = normalizeRoutePath(routePath ?? '')

  if (!normalizedBasePath) {
    return normalizedRoutePath
  }

  if (!normalizedRoutePath) {
    return normalizedBasePath
  }

  if (normalizedRoutePath.startsWith('/')) {
    return normalizedRoutePath
  }

  return normalizeRoutePath(`${normalizedBasePath}/${normalizedRoutePath}`)
}

function normalizeRoutePath(value: string) {
  if (!value) {
    return ''
  }

  const isAbsolute = value.startsWith('/')
  const segments = value
    .split('/')
    .filter((segment) => segment && segment !== '.')
    .reduce<string[]>((acc, segment) => {
      if (segment === '..') {
        acc.pop()
        return acc
      }

      acc.push(segment)
      return acc
    }, [])

  const normalizedPath = segments.join('/')

  if (!normalizedPath) {
    return isAbsolute ? '/' : ''
  }

  return isAbsolute ? `/${normalizedPath}` : normalizedPath
}
