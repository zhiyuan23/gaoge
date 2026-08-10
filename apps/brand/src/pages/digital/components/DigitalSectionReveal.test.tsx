import { render, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import DigitalSectionReveal from './DigitalSectionReveal'

describe('DigitalSectionReveal', () => {
  it('attaches a one-time entrance transform to its section', async () => {
    const { container } = render(
      <DigitalSectionReveal>
        <section>产品内容</section>
      </DigitalSectionReveal>,
    )

    await waitFor(() => {
      const reveal = container.querySelector<HTMLElement>('.digital-section-reveal')

      expect(reveal).toBeInTheDocument()
      expect(reveal?.style.transform).toContain('translate3d')
    })
  })
})
