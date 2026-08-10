import BrandPageShell from '@/brand/components/BrandPageShell'
import { useBrandMetadata } from '@/brand/metadata'
import ContentStructure from '@/pages/group/components/ContentStructure'
import DigitalStructure from '@/pages/group/components/DigitalStructure'
import GroupHero from '@/pages/group/components/GroupHero'
import GroupSectionReveal from '@/pages/group/components/GroupSectionReveal'
import GroupVision from '@/pages/group/components/GroupVision'
import LeadershipStructure from '@/pages/group/components/LeadershipStructure'
import LeagueBoard from '@/pages/group/components/LeagueBoard'
import SportsStructure from '@/pages/group/components/SportsStructure'
import {
  groupContentOverview,
  groupDigitalProducts,
  groupIndustries,
  groupLeaders,
  groupVisionItems,
  leagueDirectors,
  sportsEntities,
} from '@/pages/group/data'

export type GroupEntryPresentation = 'active' | 'direct' | 'staged'

interface GroupPageProps {
  readonly entryPresentation?: GroupEntryPresentation
}

export default function GroupPage({ entryPresentation = 'direct' }: GroupPageProps) {
  const isPersistedEntry = entryPresentation !== 'direct'

  useBrandMetadata({
    description:
      '认识高歌集团和数字、内容、影视、体育四个事业部，看见我们如何从热爱出发，让想法持续生长。',
    enabled: entryPresentation !== 'staged',
    title: '高歌集团 - 让热爱持续生长',
  })

  return (
    <BrandPageShell current="group" entryPresentation={entryPresentation}>
      <GroupHero industries={groupIndustries} skipEntranceAnimation={isPersistedEntry} />
      <GroupSectionReveal>
        <DigitalStructure products={groupDigitalProducts} />
      </GroupSectionReveal>
      <GroupSectionReveal>
        <ContentStructure overview={groupContentOverview} />
      </GroupSectionReveal>
      <GroupSectionReveal>
        <SportsStructure entities={sportsEntities} />
      </GroupSectionReveal>
      <GroupSectionReveal>
        <LeadershipStructure leaders={groupLeaders} />
      </GroupSectionReveal>
      <GroupSectionReveal>
        <LeagueBoard directors={leagueDirectors} />
      </GroupSectionReveal>
      <GroupSectionReveal>
        <GroupVision items={groupVisionItems} />
      </GroupSectionReveal>
    </BrandPageShell>
  )
}
