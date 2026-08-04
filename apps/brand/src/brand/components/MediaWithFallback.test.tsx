import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import MediaWithFallback from '@/brand/components/MediaWithFallback'

describe('MediaWithFallback', () => {
  it('keeps the label visible when no image is configured', () => {
    render(<MediaWithFallback alt="高歌 Club 产品视觉" fallbackLabel="GAOGE CLUB" />)

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByText('GAOGE CLUB')).toBeInTheDocument()
  })

  it('replaces a failed image with the branded text fallback', () => {
    render(
      <MediaWithFallback
        alt="Gaoge Compass 产品界面"
        fallbackLabel="GAOGE COMPASS"
        src="/assets/brand/compass-overview.webp"
      />,
    )

    fireEvent.error(screen.getByRole('img', { name: 'Gaoge Compass 产品界面' }))

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByText('GAOGE COMPASS')).toBeInTheDocument()
  })
})
