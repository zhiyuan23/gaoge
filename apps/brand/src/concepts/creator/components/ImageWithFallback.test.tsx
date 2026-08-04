import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import ImageWithFallback from '@/concepts/creator/components/ImageWithFallback'

describe('remote image fallback', () => {
  it('keeps the media slot when a remote image fails', () => {
    render(<ImageWithFallback alt="Project fallback" className="h-20 w-40" src="/missing.jpg" />)

    fireEvent.error(screen.getByRole('img', { name: 'Project fallback' }))

    const fallback = screen.getByRole('img', { name: 'Project fallback' })
    expect(fallback).toHaveClass('remote-image-fallback', 'h-20', 'w-40')
    expect(fallback.tagName).toBe('SPAN')
  })
})
