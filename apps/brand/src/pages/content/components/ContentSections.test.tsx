import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import ContentBelief from '@/pages/content/components/ContentBelief'
import ContentCapabilities from '@/pages/content/components/ContentCapabilities'
import ContentValue from '@/pages/content/components/ContentValue'
import { contentCapabilities } from '@/pages/content/data'

describe('content abstract field sections', () => {
  it('presents one manifesto, four capabilities and one closing statement', () => {
    const { container } = render(
      <>
        <ContentBelief />
        <ContentCapabilities capabilities={contentCapabilities} />
        <ContentValue />
      </>,
    )

    expect(
      screen.getByRole('heading', {
        name: '内容不是一次传播。它让故事持续发生，让关系慢慢留下。',
      }),
    ).toBeInTheDocument()
    expect(screen.getAllByTestId('content-capability')).toHaveLength(4)
    contentCapabilities.forEach(({ description, title }) => {
      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument()
      expect(screen.getByText(description)).toBeInTheDocument()
    })
    expect(
      screen.getByRole('heading', { name: '让一次被看见，成为持续发生的关系。' }),
    ).toBeInTheDocument()
    expect(container.querySelector('.content-closing-leading-balance')).toHaveAttribute(
      'aria-hidden',
      'true',
    )
    expect(container.querySelector('a')).not.toBeInTheDocument()
  })
})
