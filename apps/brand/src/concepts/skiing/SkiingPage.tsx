import { useEffect } from 'react'

import { useBrandMetadata } from '@/brand/metadata'
import SkiingHero from '@/concepts/skiing/components/SkiingHero'

interface SkiingPageProps {
  readonly onCapabilityOpenChange?: ((open: boolean) => void) | undefined
  readonly onGroupNavigate?: (() => void) | undefined
}

export default function SkiingPage({ onCapabilityOpenChange, onGroupNavigate }: SkiingPageProps) {
  useBrandMetadata({
    description: '高歌提供数字产品、内容运营与影视制作能力，并以非营利体育社区连接长期热爱。',
    title: '高歌 GAOGE - 享受你的热爱',
  })

  useEffect(() => {
    document.body.classList.add('skiing-active')

    return () => {
      document.body.classList.remove('skiing-active')
    }
  }, [])

  return (
    <main className="skiing-page min-h-full bg-black text-white" lang="zh-CN">
      <SkiingHero
        onCapabilityOpenChange={onCapabilityOpenChange}
        onGroupNavigate={onGroupNavigate}
      />
    </main>
  )
}
