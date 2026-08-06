import BrandPageShell from '@/brand/components/BrandPageShell'
import { useBrandMetadata } from '@/brand/metadata'
import GroupHero from '@/pages/group/components/GroupHero'
import LeadershipStructure from '@/pages/group/components/LeadershipStructure'
import LeagueBoard from '@/pages/group/components/LeagueBoard'
import SportsStructure from '@/pages/group/components/SportsStructure'
import { groupIndustries, groupLeaders, leagueDirectors, sportsEntities } from '@/pages/group/data'

export default function GroupPage() {
  useBrandMetadata({
    description: '了解高歌集团旗下高歌数字、高歌内容、高歌体育及管理团队与高歌超级联赛董事会结构。',
    title: '高歌集团 - 组织与产业版图',
  })

  return (
    <BrandPageShell current="group" crossLink={{ label: '进入高歌数字', to: '/digital' }}>
      <GroupHero industries={groupIndustries} />
      <SportsStructure entities={sportsEntities} />
      <LeadershipStructure leaders={groupLeaders} />
      <LeagueBoard directors={leagueDirectors} />
      <section
        aria-labelledby="future-title"
        className="group-future-section mx-auto max-w-7xl px-6 py-24 md:px-10 md:py-32"
      >
        <div className="group-future-orbit rounded-[28px] border border-dashed border-white/15 px-7 py-20 md:px-12 md:py-28">
          <h2
            className="max-w-3xl text-4xl font-medium tracking-[-0.06em] text-white md:text-6xl"
            id="future-title"
          >
            持续生长中的新领域
          </h2>
          <p className="mt-6 max-w-md text-sm leading-7 text-[rgb(var(--brand-muted))]">
            开放的轨道，为尚未抵达的事业保留空间。
          </p>
        </div>
      </section>
    </BrandPageShell>
  )
}
