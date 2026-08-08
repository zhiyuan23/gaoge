import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import DefaultAvatar from './DefaultAvatar'

describe('DefaultAvatar', () => {
  it('renders a leader monogram with the group marker', () => {
    render(<DefaultAvatar label="劳塔罗" marker="G" variant="leader" />)

    const avatar = screen.getByTestId('default-avatar')
    expect(avatar).toHaveAttribute('aria-hidden', 'true')
    expect(avatar).toHaveAttribute('data-avatar-size', 'standard')
    expect(avatar).toHaveAttribute('data-avatar-variant', 'leader')
    expect(avatar.querySelector('[data-avatar-glyph]')).toHaveTextContent('劳')
    expect(avatar.querySelector('[data-avatar-marker]')).toHaveTextContent('G')
  })

  it('renders a compact director monogram with its padded seat number', () => {
    render(<DefaultAvatar label="齐达内" marker="03" variant="director" />)

    const avatar = screen.getByTestId('default-avatar')
    expect(avatar).toHaveAttribute('data-avatar-size', 'compact')
    expect(avatar).toHaveAttribute('data-avatar-variant', 'director')
    expect(avatar.querySelector('[data-avatar-glyph]')).toHaveTextContent('齐')
    expect(avatar.querySelector('[data-avatar-marker]')).toHaveTextContent('03')
  })
})
