import BrandPageShell from '@/brand/components/BrandPageShell'
import { useBrandMetadata } from '@/brand/metadata'
import ContentBelief from '@/pages/content/components/ContentBelief'
import ContentCapabilities from '@/pages/content/components/ContentCapabilities'
import ContentHero from '@/pages/content/components/ContentHero'
import ContentSectionReveal from '@/pages/content/components/ContentSectionReveal'
import ContentValue from '@/pages/content/components/ContentValue'
import { contentCapabilities } from '@/pages/content/data'

export default function ContentPage() {
  useBrandMetadata({
    description: '高歌以内容策略、创作、全平台运营与社群连接，让每一份热爱持续被看见。',
    title: '高歌内容 - 内容创作与全平台运营',
  })

  return (
    <BrandPageShell current="content" crossLink={{ label: '进入高歌数字', to: '/digital' }}>
      <ContentHero />
      <ContentSectionReveal>
        <ContentBelief />
      </ContentSectionReveal>
      <ContentSectionReveal>
        <ContentCapabilities capabilities={contentCapabilities} />
      </ContentSectionReveal>
      <ContentSectionReveal>
        <ContentValue />
      </ContentSectionReveal>
    </BrandPageShell>
  )
}
