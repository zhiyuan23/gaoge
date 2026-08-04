import type { MatrixStatusValue } from '@/brand/components/MatrixStatus'

export type DigitalCategory = 'enterprise' | 'consumer' | 'platform'

export interface DigitalProduct {
  readonly category: DigitalCategory
  readonly englishName?: string
  readonly featured: boolean
  readonly href?: string
  readonly name: string
  readonly status: MatrixStatusValue
  readonly summary: string
  readonly tags: readonly string[]
  readonly visual?: {
    readonly alt: string
    readonly src: string
  }
}

export const digitalProducts: readonly DigitalProduct[] = [
  {
    category: 'enterprise',
    englishName: 'Gaoge Compass',
    featured: true,
    href: 'https://compass.gaoge.cc',
    name: '高歌跨境 ERP',
    status: 'live',
    summary: '跨境电商业务的订单、商品与经营协同系统。',
    tags: ['企业软件', '跨境电商', '独立部署'],
  },
  {
    category: 'consumer',
    englishName: 'Gaoge Club',
    featured: true,
    name: '高歌 Club',
    status: 'building',
    summary: '面向会员、活动与俱乐部关系的数字产品。',
    tags: ['会员', '活动', '社群'],
  },
  {
    category: 'enterprise',
    englishName: 'Gaoge CRM',
    featured: true,
    name: '高歌客户 CRM',
    status: 'building',
    summary: '客户关系与跟进过程的统一记录工具。',
    tags: ['客户', '跟进', '协作'],
  },
  {
    category: 'enterprise',
    englishName: 'Gaoge ERP',
    featured: false,
    name: '高歌通用 ERP',
    status: 'planned',
    summary: '面向通用经营流程的独立企业管理产品。',
    tags: ['经营', '流程', '独立产品'],
  },
  {
    category: 'enterprise',
    englishName: 'Gaoge CMS',
    featured: false,
    name: '高歌内容 CMS',
    status: 'planned',
    summary: '支持内容资产、发布流程与多平台协作。',
    tags: ['内容', '发布', '协作'],
  },
  {
    category: 'enterprise',
    englishName: 'Gaoge OA',
    featured: false,
    name: '高歌协同 OA',
    status: 'planned',
    summary: '组织内部审批、任务与日常协同工具。',
    tags: ['审批', '任务', '组织'],
  },
  {
    category: 'enterprise',
    englishName: 'Gaoge BI',
    featured: false,
    name: '高歌洞察 BI',
    status: 'planned',
    summary: '汇集经营数据并形成可读分析视图。',
    tags: ['数据', '分析', '经营'],
  },
  {
    category: 'consumer',
    featured: false,
    name: '赛事与会员',
    status: 'planned',
    summary: '面向赛事参与者的报名、会员与活动服务。',
    tags: ['赛事', '报名', '会员'],
  },
  {
    category: 'consumer',
    featured: false,
    name: '票券与现场服务',
    status: 'planned',
    summary: '支持票券流转与现场服务衔接。',
    tags: ['票券', '现场', '服务'],
  },
  {
    category: 'platform',
    englishName: 'Gaoge IAM',
    featured: false,
    name: '身份与权限',
    status: 'planned',
    summary: '统一身份、访问控制与产品间权限边界。',
    tags: ['身份', '权限', '安全'],
  },
  {
    category: 'platform',
    featured: false,
    name: '工作流与数据',
    status: 'planned',
    summary: '让业务流程和共享数据能力独立复用。',
    tags: ['工作流', '数据', '复用'],
  },
  {
    category: 'platform',
    featured: false,
    name: 'AI 与连接器',
    status: 'planned',
    summary: '提供受控的智能能力与外部系统连接。',
    tags: ['AI', '连接器', '集成'],
  },
  {
    category: 'platform',
    featured: false,
    name: '多端交付',
    status: 'building',
    summary: '支持 Web、桌面、移动与小程序交付。',
    tags: ['Web', '桌面', '移动'],
  },
]

export const featuredDigitalProducts = digitalProducts.filter(({ featured }) => featured)

export const digitalDirectory = digitalProducts.filter(({ featured }) => !featured)

export const digitalCapabilities = [
  '独立产品',
  '共享平台能力',
  '独立部署与专属云',
  '后续 SaaS',
] as const
