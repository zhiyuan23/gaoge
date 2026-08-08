export interface GroupIndustry {
  readonly description: string
  readonly direction: '产品矩阵' | '内容运营' | '影像创作' | '体育生态'
  readonly id: 'digital' | 'content' | 'film' | 'sports'
  readonly name: string
}

export interface GroupDigitalProduct {
  readonly description: string
  readonly emphasis: 'primary' | 'secondary'
  readonly englishName: string
  readonly href: string
  readonly id: 'compass' | 'crm' | 'club'
  readonly name: string
}

export interface BusinessCapability {
  readonly capabilities: readonly string[]
  readonly description: string
  readonly id: 'digital' | 'content' | 'film'
  readonly name: string
  readonly positioning: string
}

export interface DeliveryModel {
  readonly description: string
  readonly id: 'direct' | 'coordinated' | 'sports-support'
  readonly name: string
}

export interface GroupLeader {
  readonly avatar?: {
    readonly alt: string
    readonly src: string
  }
  readonly id: string
  readonly nickname: string
  readonly role: string
  readonly scope: 'group' | 'digital' | 'content' | 'sports' | 'club' | 'league'
}

export interface GroupVisionItem {
  readonly description: string
  readonly id: 'passion' | 'action' | 'together'
  readonly title: string
}

export interface LeagueDirector {
  readonly avatar?: {
    readonly alt: string
    readonly src: string
  }
  readonly id: string
  readonly nickname: string
  readonly seat: number
}

export interface SportsEntity {
  readonly description: string
  readonly id: 'club' | 'league'
  readonly name: string
}
