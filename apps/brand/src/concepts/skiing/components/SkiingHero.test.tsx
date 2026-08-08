import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import SkiingHero from '@/concepts/skiing/components/SkiingHero'

let reducedMotion = true

vi.mock('framer-motion', async (importOriginal) => ({
  ...(await importOriginal<typeof import('framer-motion')>()),
  useReducedMotion: () => reducedMotion,
}))

describe('SkiingHero', () => {
  beforeEach(() => {
    reducedMotion = true
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('uses the static skiing poster instead of video when reduced motion is requested', () => {
    const { container } = render(
      <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <SkiingHero />
      </MemoryRouter>,
    )

    expect(screen.getByRole('img', { name: '滑雪运动员穿越雪地' })).toHaveAttribute(
      'src',
      '/assets/brand/skiing-poster.jpg',
    )
    expect(container.querySelector('video')).not.toBeInTheDocument()
  })

  it('uses linear mobile signals and the refined mobile title rhythm', () => {
    const { container } = render(
      <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <SkiingHero />
      </MemoryRouter>,
    )

    for (const name of [
      '打开体育能力说明',
      '打开数字能力说明',
      '打开影视能力说明',
      '打开内容能力说明',
    ]) {
      const signal = screen.getByRole('button', { name })

      expect(signal).toHaveClass('hero-signal', 'min-h-12', 'touch-manipulation')
      expect(signal).toHaveClass('active:scale-[0.98]', 'md:min-h-0')
      expect(signal).not.toHaveClass('rounded-full', 'bg-black/35', 'backdrop-blur-md')
    }

    expect(container.querySelectorAll('.brand-signal-divider--mobile')).toHaveLength(4)
    expect(container.querySelectorAll('.brand-signal-divider--desktop')).toHaveLength(4)
    expect(
      container.querySelector('.hero-signal--digital .brand-signal-divider--mobile'),
    ).toHaveClass('rotate-[20deg]')
    expect(
      container.querySelector('.hero-signal--digital .brand-signal-divider--desktop'),
    ).toHaveClass('rotate-[20deg]')
    expect(screen.getByRole('button', { name: '打开影视能力说明' })).toHaveClass(
      'left-4',
      'top-24',
      'md:left-auto',
      'md:right-[12%]',
      'md:top-[32%]',
    )
    expect(screen.getByText('enjoy')).toHaveClass('left-[4vw]', 'top-[22%]')
    expect(screen.getByText('your')).toHaveClass('right-[4vw]', 'top-[38%]')
    expect(screen.getByText('passion')).toHaveClass('left-[10vw]', 'top-[61%]')
  })

  it('retries the online hero video through WeChat and the first touch', () => {
    reducedMotion = false
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
    const { container } = render(
      <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <SkiingHero />
      </MemoryRouter>,
    )
    const video = container.querySelector('video')

    expect(video).not.toBeNull()
    expect(video).toHaveAttribute('preload', 'auto')
    expect(video).toHaveAttribute('webkit-playsinline', 'true')
    expect(video).toHaveAttribute('x5-playsinline', 'true')
    expect(video).toHaveAttribute('x5-video-player-type', 'h5-page')
    expect(video).toHaveProperty('muted', true)
    expect(video).toHaveProperty('defaultMuted', true)
    expect(play).toHaveBeenCalledTimes(1)

    act(() => {
      document.dispatchEvent(new Event('WeixinJSBridgeReady'))
    })
    expect(play).toHaveBeenCalledTimes(2)

    fireEvent.canPlay(video as HTMLVideoElement)
    expect(play).toHaveBeenCalledTimes(3)

    fireEvent.touchStart(document)
    expect(play).toHaveBeenCalledTimes(4)

    fireEvent.touchStart(document)
    expect(play).toHaveBeenCalledTimes(4)
  })
})
