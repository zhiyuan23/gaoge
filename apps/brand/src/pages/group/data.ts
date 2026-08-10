import type {
  BusinessCapability,
  DeliveryModel,
  GroupContentOverview,
  GroupDigitalProduct,
  GroupIndustry,
  GroupLeader,
  GroupVisionItem,
  LeagueDirector,
  SportsEntity,
} from './types'

export const groupIndustries: readonly GroupIndustry[] = [
  {
    description: '以技术与产品思维，把想法转化为面向未来的数字能力。',
    direction: '产品矩阵',
    id: 'digital',
    name: '高歌数字',
  },
  {
    description: '以创意与内容思维，把热爱转化为持续生长的影响力。',
    direction: '内容运营',
    id: 'content',
    name: '高歌内容',
  },
  {
    description: '以影像与叙事思维，把想法转化为承载情感与表达的光影作品。',
    direction: '影像创作',
    id: 'film',
    name: '高歌影视',
  },
  {
    description: '以运动与连接的力量，把热爱转化为真实发生的共同体验。',
    direction: '体育生态',
    id: 'sports',
    name: '高歌体育',
  },
]

export const groupDigitalProducts: readonly GroupDigitalProduct[] = [
  {
    description: '连接订单、商品、库存、履约、财务与经营分析，让跨境电商经营在一套系统中清晰协同。',
    emphasis: 'primary',
    englishName: 'GAOGE COMPASS',
    href: 'https://compass.gaoge.cc?demo',
    id: 'compass',
    name: '高歌跨境 ERP',
  },
  {
    description: '统一记录线索、客户、商机与跟进过程。',
    emphasis: 'secondary',
    englishName: 'GAOGE CRM',
    href: 'https://crm.gaoge.cc?demo',
    id: 'crm',
    name: '高歌客户 CRM',
  },
  {
    description: '连接会员、活动、社群与俱乐部日常运营。',
    emphasis: 'secondary',
    englishName: 'GAOGE CLUB',
    href: 'https://club.gaoge.cc?demo',
    id: 'club',
    name: '高歌 Club',
  },
]

export const groupContentOverview: GroupContentOverview = {
  capabilities: ['内容策略', '内容创作', '全平台运营', '社群连接'],
  description: '以内容与运营连接品牌、平台和真实社群。',
  eyebrow: 'GAOGE CONTENT',
  headline: ['让每一份热爱', '持续被看见。'],
  href: '/content',
}

export const businessCapabilities: readonly BusinessCapability[] = [
  {
    capabilities: ['软件产品', '定制开发', '系统集成', '部署与维护'],
    description: '研发、销售和交付企业软件，并提供定制开发、系统集成及持续运维。',
    id: 'digital',
    name: '高歌数字',
    positioning: '企业软件与数字化解决方案',
  },
  {
    capabilities: ['平台运营', '内容策划', '图文与日常视觉', '轻量短视频'],
    description: '承接品牌定位确定后的多平台运营、内容生产与日常视觉执行。',
    id: 'content',
    name: '高歌内容',
    positioning: '内容运营与视觉创作',
  },
  {
    capabilities: ['创意与脚本', '专业拍摄', '剪辑与后期', '影视作品开发'],
    description: '制作企业宣传片、品牌片及专业影像，同时持续开发自主影视作品。',
    id: 'film',
    name: '高歌影视',
    positioning: '专业影像制作与影视作品开发',
  },
]

export const deliveryModels: readonly DeliveryModel[] = [
  {
    description: '客户可直接向高歌数字、高歌内容或高歌影视采购，由对应事业群独立签约和交付。',
    id: 'direct',
    name: '独立采购',
  },
  {
    description: '同时涉及系统、内容和影像时，由高歌集团统筹资源与联合交付。',
    id: 'coordinated',
    name: '集团统筹',
  },
  {
    description: '高歌体育可以使用集团内部的技术、内容和影像能力，同时保持非营利属性。',
    id: 'sports-support',
    name: '体育内部支持',
  },
]

export const sportsEntities: readonly SportsEntity[] = [
  {
    description: '一群因足球相聚的伙伴，一起训练、比赛，也一起享受每一次上场。',
    id: 'club',
    name: '高歌足球俱乐部',
  },
  {
    description: '为球友们持续组织的联赛，让熟悉的人和新的伙伴都能在球场相见。',
    id: 'league',
    name: '高歌超级联赛',
  },
]

export const groupLeaders: readonly GroupLeader[] = [
  { id: 'group-chair', nickname: '劳塔罗', role: '集团主席', scope: 'group' },
  { id: 'club-ceo', nickname: '齐达内', role: '高歌足球俱乐部 CEO', scope: 'club' },
  {
    id: 'league-operator',
    nickname: '劳塔罗',
    role: '高歌超级联赛运营负责人',
    scope: 'league',
  },
]

export const groupVisionItems: readonly GroupVisionItem[] = [
  {
    description: '从真正喜欢的事情开始，保持好奇，也保持行动。',
    id: 'passion',
    title: '因热爱出发',
  },
  {
    description: '用技术、内容、影像与体育，把想法带进真实生活。',
    id: 'action',
    title: '让想法发生',
  },
  {
    description: '珍惜每一次相遇，在共同创造中走得更远。',
    id: 'together',
    title: '与伙伴同行',
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
