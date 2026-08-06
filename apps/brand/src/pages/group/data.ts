import type { GroupIndustry, GroupLeader, LeagueDirector, SportsEntity } from './types'

export const groupIndustries: readonly GroupIndustry[] = [
  {
    description: '以技术与产品连接真实业务。',
    href: '/digital',
    id: 'digital',
    name: '高歌数字',
    status: 'active',
  },
  {
    alias: '高歌小绿本',
    description: '让内容、品牌与热爱持续生长。',
    href: '/content',
    id: 'content',
    name: '高歌内容',
    status: 'active',
  },
  {
    description: '连接球队、赛事与共同体验。',
    href: 'https://sports.gaoge.cc',
    id: 'sports',
    name: '高歌体育',
    status: 'active',
    target: '_blank',
  },
  {
    description: '为尚未抵达的事业保留空间。',
    id: 'future',
    name: '未来领域',
    status: 'future',
  },
]

export const sportsEntities: readonly SportsEntity[] = [
  { description: '集团现有球队', id: 'club', name: '高歌 FC' },
  { description: '集团运营的赛事品牌', id: 'league', name: '高歌超级联赛' },
]

export const groupLeaders: readonly GroupLeader[] = [
  { id: 'group-lead', nickname: '劳塔罗', role: '集团主席', scope: 'group' },
  { id: 'digital-lead', nickname: '劳塔罗', role: '高歌数字CEO', scope: 'digital' },
  { id: 'content-lead', nickname: '劳塔罗', role: '高歌内容CEO', scope: 'content' },
  { id: 'sports-lead', nickname: '齐达内', role: '高歌体育CEO', scope: 'sports' },
  { id: 'club-lead', nickname: '齐达内', role: '高歌 FC 管理负责人', scope: 'club' },
  {
    id: 'league-lead',
    nickname: '劳塔罗',
    role: '高歌超级联赛运营负责人',
    scope: 'league',
  },
]

const leagueDirectorNicknames = [
  '劳塔罗',
  '皮耶罗',
  '吉格斯',
  '赵继伟',
  '睡皮',
  '欧文',
  '托雷斯',
  '阿兰',
  '巴雷西',
  '齐达内',
  '奥纳纳',
  '方昊',
  '安东尼',
  '肥罗',
  '伊尔迪兹',
  '巴蒂',
  '博格坎普',
  '福登',
  '浩克',
  '宋凯',
] as const

export const leagueDirectors: readonly LeagueDirector[] = leagueDirectorNicknames.map(
  (nickname, index) => ({
    id: `league-director-${index + 1}`,
    nickname,
    seat: index + 1,
  }),
)
