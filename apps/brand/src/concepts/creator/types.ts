export interface NavigationItem {
  readonly label: string
  readonly targetId: string
}

export interface ServiceItem {
  readonly number: string
  readonly name: string
  readonly description: string
}

export interface ProjectItem {
  readonly number: string
  readonly category: string
  readonly name: string
  readonly images: readonly [string, string, string]
}

export interface DecorativeImage {
  readonly alt: string
  readonly className: string
  readonly delay: number
  readonly src: string
  readonly x: number
}
