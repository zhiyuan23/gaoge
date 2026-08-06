export interface GroupIndustry {
  readonly alias?: string
  readonly description: string
  readonly href?: string
  readonly id: 'digital' | 'content' | 'sports' | 'future'
  readonly name: string
  readonly status: 'active' | 'future'
  readonly target?: '_blank'
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
