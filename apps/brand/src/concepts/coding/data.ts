export interface FeatureCardData {
  readonly number: string
  readonly title: string
  readonly imageUrl: string
  readonly checklist: readonly string[]
}

export const navigationItems = [
  'Our story',
  'Collective',
  'Workshops',
  'Programs',
  'Inquiries',
] as const

export const aboutBody =
  'Over the last seven years, I have worked with Parallax, a Berlin-based production house that crafts cinema, series, and Noir Studio in Paris. Together, we have created work that has earned international acclaim at several major festivals.'

export const featureCards = [
  {
    number: '01',
    title: 'Project Storyboard.',
    imageUrl:
      'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260405_171918_4a5edc79-d78f-4637-ac8b-53c43c220606.png&w=1280&q=85',
    checklist: [
      'Shape every scene on a visual timeline.',
      'Organize shots, references, and ideas.',
      'Track creative changes as they happen.',
      'Share storyboards with your team.',
    ],
  },
  {
    number: '02',
    title: 'Smart Critiques.',
    imageUrl:
      'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260405_171741_ed9845ab-f5b2-4018-8ce7-07cc01823522.png&w=1280&q=85',
    checklist: [
      'AI analysis built around your visual language.',
      'Focused creative notes without the noise.',
      'Integrations for the tools you already use.',
    ],
  },
  {
    number: '03',
    title: 'Immersion Capsule.',
    imageUrl:
      'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260405_171809_f56666dc-c099-4778-ad82-9ad4f209567b.png&w=1280&q=85',
    checklist: [
      'Silence notifications when focus begins.',
      'Move through curated ambient soundscapes.',
      'Sync deep work with your schedule.',
    ],
  },
] as const satisfies readonly FeatureCardData[]
