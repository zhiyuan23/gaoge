import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import BrandNavigation from '@/brand/components/BrandNavigation'

interface BrandPageShellProps {
  readonly children: ReactNode
  readonly crossLink?: {
    readonly label: string
    readonly to: '/content' | '/digital'
  }
  readonly current: 'content' | 'digital' | 'group'
}

export default function BrandPageShell({ children, crossLink, current }: BrandPageShellProps) {
  return (
    <main
      className={`brand-matrix-page min-h-full ${
        current === 'group' ? 'overflow-x-clip' : 'overflow-hidden'
      }`}
      data-brand-area={current}
      lang="zh-CN"
    >
      <BrandNavigation current={current} />
      {children}
      <footer className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-6 py-12 text-sm text-white/60 md:px-10">
        <Link className="rounded-full transition-colors hover:text-white" to="/">
          返回高歌首页
        </Link>
        {crossLink ? (
          <Link className="rounded-full transition-colors hover:text-white" to={crossLink.to}>
            {crossLink.label}
          </Link>
        ) : null}
      </footer>
    </main>
  )
}
