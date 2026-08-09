import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import GroupHero from '@/pages/group/components/GroupHero'

describe('GroupHero', () => {
  it('leaves persisted foreground presentation to the page state CSS', () => {
    render(<GroupHero industries={[]} skipEntranceAnimation />)

    const copy = screen.getByRole('heading', { name: 'GAOGE GROUP' }).parentElement
    const orbit = copy?.nextElementSibling
    const copyStyle = copy?.getAttribute('style') ?? ''
    const orbitStyle = orbit?.getAttribute('style') ?? ''

    expect(copy).toHaveClass('group-entry-copy')
    expect(orbit).toHaveClass('group-entry-orbit')
    expect(copyStyle).not.toContain('opacity')
    expect(copyStyle).not.toContain('transform')
    expect(orbitStyle).not.toContain('opacity')
    expect(orbitStyle).not.toContain('transform')
  })
})
