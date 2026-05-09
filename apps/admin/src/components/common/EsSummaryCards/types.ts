export type EsSummaryCardColor = 'emerald' | 'rose' | 'amber' | 'sky' | 'slate'

export interface EsSummaryCardItem {
  key: string
  label: string
  value: string | number
  badge?: string
  color?: EsSummaryCardColor
  cardClass?: string
  labelClass?: string
  valueClass?: string
  badgeClass?: string
}

export interface EsSummaryCardsProps {
  items: EsSummaryCardItem[]
  gridClass?: string
}
