import { useEffect } from 'react'

import { useBrandMetadata } from '@/brand/metadata'
import SkiingHero from '@/concepts/skiing/components/SkiingHero'

export default function SkiingPage() {
  useBrandMetadata({
    description: '高歌以数字产品、内容运营与体育热爱，连接正在发生的未来。',
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
      <SkiingHero />
    </main>
  )
}
