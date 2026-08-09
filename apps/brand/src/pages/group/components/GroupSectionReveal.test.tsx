import { render, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import GroupSectionReveal from './GroupSectionReveal'

describe('GroupSectionReveal', () => {
  it('attaches the one-time entrance transform to the rendered section', async () => {
    const { container } = render(
      <GroupSectionReveal>
        <section>章节内容</section>
      </GroupSectionReveal>,
    )

    await waitFor(() => {
      const reveal = container.querySelector<HTMLElement>('.group-section-reveal')

      expect(reveal).toBeInTheDocument()
      expect(reveal?.style.transform).toContain('translate3d')
    })
  })
})
