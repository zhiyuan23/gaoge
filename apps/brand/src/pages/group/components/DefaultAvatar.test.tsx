import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import DefaultAvatar from './DefaultAvatar'

describe('DefaultAvatar', () => {
  it('renders a decorative standard avatar by default', () => {
    render(<DefaultAvatar />)

    const avatar = screen.getByTestId('default-avatar')
    expect(avatar).toHaveAttribute('aria-hidden', 'true')
    expect(avatar).toHaveAttribute('data-avatar-size', 'standard')
  })

  it('supports the compact director size', () => {
    render(<DefaultAvatar size="compact" variant="placeholder" />)

    const avatar = screen.getByTestId('default-avatar')
    expect(avatar).toHaveAttribute('data-avatar-size', 'compact')
    expect(avatar).toHaveAttribute('data-avatar-variant', 'placeholder')
  })
})
