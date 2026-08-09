import { useEffect } from 'react'

interface BrandMetadata {
  readonly description: string
  readonly enabled?: boolean
  readonly title: string
}

export function useBrandMetadata({ description, enabled = true, title }: BrandMetadata): void {
  useEffect(() => {
    if (!enabled) return

    const previousTitle = document.title
    const existingDescription = document.head.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    )
    const descriptionElement = existingDescription ?? document.createElement('meta')
    const createdDescription = !existingDescription
    const previousDescription = existingDescription?.content ?? ''

    if (createdDescription) {
      descriptionElement.name = 'description'
      document.head.appendChild(descriptionElement)
    }

    document.title = title
    descriptionElement.content = description

    return () => {
      document.title = previousTitle

      if (createdDescription) {
        descriptionElement.remove()
      } else {
        descriptionElement.content = previousDescription
      }
    }
  }, [description, enabled, title])
}
