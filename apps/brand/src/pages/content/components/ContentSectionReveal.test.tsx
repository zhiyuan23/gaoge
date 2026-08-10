import { render, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import ContentSectionReveal from './ContentSectionReveal'

describe('ContentSectionReveal', () => {
  it('attaches a one-time entrance transform to its section', async () => {
    const { container } = render(
      <ContentSectionReveal>
        <section>内容矩阵</section>
      </ContentSectionReveal>,
    )

    await waitFor(() => {
      const reveal = container.querySelector<HTMLElement>('.content-section-reveal')

      expect(reveal).toBeInTheDocument()
      expect(reveal?.style.transform).toContain('translate3d')
    })
  })
})
