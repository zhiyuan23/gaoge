export type IconOutputType = 'iconify' | 'img' | 'svg'

export interface ResolvedIconSource {
  name: string
  outputType: IconOutputType
}

export function resolveIconSource(name: string): ResolvedIconSource {
  const hasPathFeatures = /^\.{1,2}\//.test(name) || name.startsWith('/') || name.includes('/')
  if (/^https?:\/\//.test(name) || hasPathFeatures || !name) {
    return { name, outputType: 'img' }
  }

  const unoCssIcon = name.match(/^i-([^:]+):(.+)$/)
  if (unoCssIcon) {
    return { name: `${unoCssIcon[1]}:${unoCssIcon[2]}`, outputType: 'iconify' }
  }

  if (name.includes(':')) {
    return { name, outputType: 'iconify' }
  }

  return { name, outputType: 'svg' }
}
