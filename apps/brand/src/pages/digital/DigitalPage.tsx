import BrandPageShell from '@/brand/components/BrandPageShell'
import { useBrandMetadata } from '@/brand/metadata'
import CurrentProducts from '@/pages/digital/components/CurrentProducts'
import DigitalDelivery from '@/pages/digital/components/DigitalDelivery'
import DigitalHero from '@/pages/digital/components/DigitalHero'
import DigitalSectionReveal from '@/pages/digital/components/DigitalSectionReveal'
import ProductRoadmap from '@/pages/digital/components/ProductRoadmap'
import {
  digitalCapabilities,
  featuredDigitalProducts,
  plannedDigitalProducts,
} from '@/pages/digital/data'

export default function DigitalPage() {
  useBrandMetadata({
    description: '高歌数字旗下企业软件、消费者应用与平台能力。',
    title: '高歌数字 - 数字产品矩阵',
  })

  return (
    <BrandPageShell current="digital" crossLink={{ label: '进入高歌内容', to: '/content' }}>
      <DigitalHero />
      <DigitalSectionReveal>
        <CurrentProducts products={featuredDigitalProducts} />
      </DigitalSectionReveal>
      <DigitalSectionReveal>
        <ProductRoadmap products={plannedDigitalProducts} />
      </DigitalSectionReveal>
      <DigitalSectionReveal>
        <DigitalDelivery capabilities={digitalCapabilities} />
      </DigitalSectionReveal>
    </BrandPageShell>
  )
}
