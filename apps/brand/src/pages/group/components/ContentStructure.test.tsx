import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import ContentStructure from '@/pages/group/components/ContentStructure'
import { groupContentOverview } from '@/pages/group/data'

describe('ContentStructure', () => {
  it('presents the content manifesto, capabilities and a separate internal entry', () => {
    const { container } = render(
      <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <ContentStructure overview={groupContentOverview} />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: '高歌内容' })).toBeInTheDocument()
    expect(screen.getByText('让每一份热爱')).toBeInTheDocument()
    expect(screen.getByText('持续被看见。')).toBeInTheDocument()
    expect(screen.getByText('以内容与运营连接品牌、平台和真实社群。')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '进入高歌内容' })).toHaveAttribute('href', '/content')
    expect(screen.getByRole('link', { name: '进入高歌内容' })).not.toHaveAttribute('target')
    const contentCard = screen.getByTestId('group-content-card')
    expect(contentCard.tagName).toBe('ARTICLE')
    expect(contentCard).toHaveClass(
      'hover:-translate-y-1',
      'hover:border-white/25',
      'active:scale-[0.985]',
    )
    expect(container.querySelector('.group-content-card a')).not.toBeInTheDocument()
    groupContentOverview.capabilities.forEach((capability) => {
      expect(screen.getByText(capability)).toBeInTheDocument()
    })
  })
})
