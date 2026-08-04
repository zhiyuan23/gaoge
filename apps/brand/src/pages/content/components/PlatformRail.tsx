import type { ContentPlatform } from '@/pages/content/config'
import { platformLabels } from '@/pages/content/config'

interface PlatformRailProps {
  readonly platforms: readonly ContentPlatform[]
}

export default function PlatformRail({ platforms }: PlatformRailProps) {
  return (
    <ul aria-label="内容发布平台" className="flex flex-wrap gap-3">
      {platforms.map((platform, index) => (
        <li
          className={`rounded-full border border-white/15 px-4 py-2 text-sm text-white/70 ${
            index % 2 === 0 ? 'md:translate-y-1' : 'md:-translate-y-1'
          }`}
          key={platform}
        >
          {platformLabels[platform]}
        </li>
      ))}
    </ul>
  )
}
