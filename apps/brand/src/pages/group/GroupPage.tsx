import BrandPageShell from '@/brand/components/BrandPageShell'
import { useBrandMetadata } from '@/brand/metadata'
import DigitalStructure from '@/pages/group/components/DigitalStructure'
import GroupHero from '@/pages/group/components/GroupHero'
import GroupVision from '@/pages/group/components/GroupVision'
import LeadershipStructure from '@/pages/group/components/LeadershipStructure'
import LeagueBoard from '@/pages/group/components/LeagueBoard'
import SportsStructure from '@/pages/group/components/SportsStructure'
import {
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
      <DigitalStructure products={groupDigitalProducts} />
      <SportsStructure entities={sportsEntities} />
      <LeadershipStructure leaders={groupLeaders} />
      <LeagueBoard directors={leagueDirectors} />
      <GroupVision items={groupVisionItems} />
    </BrandPageShell>
  )
}
