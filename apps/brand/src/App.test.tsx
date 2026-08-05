import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import App from '@/App'
import { navigationItems } from '@/concepts/creator/data'

function LocationDisplay() {
  const location = useLocation()

  return <output data-testid="location">{location.pathname}</output>
}

function renderRoute(pathname: string) {
  return render(
    <MemoryRouter
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
      initialEntries={[pathname]}
    >
      <App />
      <LocationDisplay />
    </MemoryRouter>,
  )
}

describe('concept index route', () => {
  it('lists every registered concept', async () => {
    renderRoute('/concepts')

    expect(await screen.findByRole('heading', { name: 'Concepts' })).toBeInTheDocument()
    ;['Skiing', 'Coding', 'Creator'].forEach((name) => {
      expect(screen.getByRole('heading', { name })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: `在新标签页打开 ${name}` })).toBeInTheDocument()
    })
    expect(screen.getAllByRole('link', { name: '查看页面' }).map((link) => link)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ href: expect.stringContaining('/concepts/skiing') }),
        expect.objectContaining({ href: expect.stringContaining('/concepts/coding') }),
        expect.objectContaining({ href: expect.stringContaining('/concepts/creator') }),
      ]),
    )
  })

  it('redirects unknown concept paths to the concept index', async () => {
    renderRoute('/concepts/missing-page')

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/concepts')
    })
    expect(screen.getByRole('heading', { name: 'Concepts' })).toBeInTheDocument()
  })
})

describe('Skiing concept route', () => {
  it('renders the GAOGE brand hero at its dedicated path', async () => {
    const { container } = renderRoute('/concepts/skiing')

    const heroHeading = await screen.findByRole('heading', { name: 'enjoy your passion' })
    const hero = heroHeading.closest('section')

    expect(heroHeading).toBeInTheDocument()
    expect(hero).not.toBeNull()
    expect(screen.getByRole('link', { name: '高歌首页' })).toHaveTextContent('GAOGE')
    expect(screen.getByText(/享受你的热爱/)).toBeInTheDocument()
    expect(
      screen.getByText(/以数字产品、内容运营与体育热爱，连接正在发生的未来/),
    ).toBeInTheDocument()
    ;['SPORTS', 'DIGITAL', 'CONTENT', '体育热爱', '数字产品', '内容创造'].forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument()
    })

    const digitalButton = screen.getByRole('button', { name: '数字' })
    const contentButton = screen.getByRole('button', { name: '内容' })
    const sportsButton = screen.getByRole('button', { name: '体育' })
    const futureButton = screen.getByRole('button', { name: '未来' })

    expect(digitalButton).toHaveAttribute('aria-haspopup', 'dialog')
    expect(contentButton).toHaveAttribute('aria-haspopup', 'dialog')
    expect(sportsButton).toHaveAttribute('aria-haspopup', 'dialog')
    expect(futureButton).toHaveAttribute('aria-haspopup', 'dialog')
    expect(futureButton).not.toHaveClass('text-neutral-500')
    ;[digitalButton, contentButton, sportsButton, futureButton].forEach((button) => {
      expect(button).toHaveClass('hover:text-white')
      expect(button).not.toHaveClass('hover:bg-white/10')
    })
    for (const oldLinkName of ['进入数字产品', '进入内容创造', '进入高歌体育']) {
      expect(screen.queryByRole('link', { name: oldLinkName })).not.toBeInTheDocument()
    }

    expect(screen.queryAllByText('暂未开放')).toHaveLength(0)
    expect(hero?.querySelector('[aria-disabled="true"]')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '打开高歌品牌能力说明' })).not.toBeInTheDocument()
    for (const name of ['打开体育能力说明', '打开数字能力说明', '打开内容能力说明']) {
      const button = screen.getByRole('button', { name })

      expect(button).toHaveAttribute('aria-haspopup', 'dialog')
      expect(button).toHaveClass('min-h-12')
      expect(button).toHaveClass('touch-manipulation')
      expect(button).toHaveClass('active:scale-[0.98]')
      expect(button).not.toHaveClass('rounded-full', 'bg-black/35', 'backdrop-blur-md')
    }
    expect(
      screen.queryByRole('button', { name: '开发者联系方式，敬请期待' }),
    ).not.toBeInTheDocument()
    expect(screen.queryByText('securify')).not.toBeInTheDocument()
    expect(screen.queryByText('+65k')).not.toBeInTheDocument()
    expect(document.title).toBe('高歌 GAOGE - 享受你的热爱')

    const video = container.querySelector('video')

    expect(screen.getByRole('img', { name: '滑雪运动员穿越雪地' })).toHaveAttribute(
      'src',
      '/assets/brand/skiing-poster.jpg',
    )
    expect(video).toHaveAttribute(
      'src',
      'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260418_063509_7d167302-4fd4-480b-8260-18ab572333d4.mp4',
    )
    expect(video).toHaveAttribute('poster', '/assets/brand/skiing-poster.jpg')
    expect(video).toHaveAttribute('autoplay')
    expect(video).toHaveAttribute('loop')
    expect(video).toHaveAttribute('playsinline')
    expect(video).toHaveProperty('muted', true)
  })

  it('opens homepage capability details without changing route', async () => {
    renderRoute('/')

    const digitalButton = await screen.findByRole('button', { name: '数字' })
    fireEvent.click(digitalButton)

    expect(screen.getByTestId('location')).toHaveTextContent('/')
    expect(screen.getByRole('dialog')).toHaveAttribute('open')
    expect(screen.getByRole('dialog').tagName).toBe('DIALOG')
    expect(screen.getByRole('heading', { name: '数字' })).toBeInTheDocument()
    expect(screen.getByText('产品矩阵')).toBeInTheDocument()
    expect(
      screen.getByText('以技术与产品思维，把想法转化为面向未来的数字能力。'),
    ).toBeInTheDocument()

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveClass('brand-capability-dialog')
    expect(within(dialog).getByTestId('capability-panel')).toHaveClass('brand-capability-panel')
    expect(within(dialog).queryByRole('link')).not.toBeInTheDocument()

    fireEvent.click(within(dialog).getByRole('button', { name: '内容' }))
    expect(within(dialog).getByRole('heading', { name: '内容' })).toBeInTheDocument()
    expect(within(dialog).getByText('内容运营')).toBeInTheDocument()
    expect(
      within(dialog).getByText('以创意与内容思维，把热爱转化为持续生长的影响力。'),
    ).toBeInTheDocument()

    fireEvent.click(within(dialog).getByRole('button', { name: '体育' }))
    expect(within(dialog).getByRole('heading', { name: '体育' })).toBeInTheDocument()
    expect(within(dialog).getByText('体育生态')).toBeInTheDocument()
    expect(
      within(dialog).getByText('以运动与连接的力量，把热爱转化为真实发生的共同体验。'),
    ).toBeInTheDocument()

    fireEvent.click(within(dialog).getByRole('button', { name: '未来' }))
    expect(within(dialog).getByRole('heading', { name: '未来' })).toBeInTheDocument()
    expect(
      within(dialog).getByText('以好奇与行动不断探索，把未知转化为值得期待的新可能。'),
    ).toBeInTheDocument()
    expect(within(dialog).getByText('领域拓展中')).toBeInTheDocument()
  })

  it.each([
    ['打开体育能力说明', '体育'],
    ['打开数字能力说明', '数字'],
    ['打开内容能力说明', '内容'],
  ] as const)('opens %s from the hero without changing route', async (buttonName, heading) => {
    renderRoute('/')

    const trigger = await screen.findByRole('button', { name: buttonName })

    expect(trigger).toHaveClass('active:scale-[0.98]')
    expect(trigger).toHaveClass('focus-visible:outline')

    fireEvent.click(trigger)

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('open')
    expect(within(dialog).getByRole('heading', { name: heading })).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/')

    fireEvent.click(within(dialog).getByRole('button', { name: '关闭能力说明' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it('closes the capability dialog with Escape and restores focus', async () => {
    renderRoute('/')

    const trigger = await screen.findByRole('button', { name: '数字' })
    fireEvent.click(trigger)

    const closeButton = screen.getByRole('button', { name: '关闭能力说明' })
    await waitFor(() => expect(closeButton).toHaveFocus())

    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it('closes the capability dialog from its close button and backdrop', async () => {
    renderRoute('/')

    fireEvent.click(await screen.findByRole('button', { name: '数字' }))
    const closeDialog = screen.getByRole('dialog')
    fireEvent.click(screen.getByRole('button', { name: '关闭能力说明' }))
    expect(closeDialog).toHaveAttribute('data-closing')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: '内容' }))
    fireEvent.click(screen.getByRole('button', { name: '点击遮罩关闭能力说明' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('closes the capability dialog immediately when reduced motion is requested', async () => {
    vi.mocked(window.matchMedia).mockImplementation(
      (query) =>
        ({
          addEventListener: vi.fn(),
          addListener: vi.fn(),
          dispatchEvent: vi.fn(),
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          removeEventListener: vi.fn(),
          removeListener: vi.fn(),
        }) as MediaQueryList,
    )
    renderRoute('/')

    const trigger = await screen.findByRole('button', { name: '数字' })
    fireEvent.click(trigger)
    fireEvent.click(screen.getByRole('button', { name: '关闭能力说明' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it.each(['/', '/missing-page'])(
    'uses the Skiing concept as the homepage for %s',
    async (path) => {
      renderRoute(path)

      expect(await screen.findByRole('heading', { name: 'enjoy your passion' })).toBeInTheDocument()
      await waitFor(() => {
        expect(screen.getByTestId('location')).toHaveTextContent('/')
      })
    },
  )
})

describe('formal brand routes', () => {
  it.each([
    ['/digital', 'GAOGE DIGITAL'],
    ['/content', 'GAOGE CONTENT'],
  ])('keeps %s as a formal brand route', async (path, heading) => {
    renderRoute(path)

    expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent(path)
  })
})

describe('digital matrix route', () => {
  it('renders the product matrix with truthful link behavior', async () => {
    renderRoute('/digital')

    expect(await screen.findByRole('heading', { name: 'GAOGE DIGITAL' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '让复杂业务有清晰系统。' })).toBeInTheDocument()
    expect(screen.getByText('高歌跨境 ERP')).toBeInTheDocument()
    expect(screen.getByText('高歌 Club')).toBeInTheDocument()
    expect(screen.getByText('高歌客户 CRM')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '企业软件' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '消费者与体育产品' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '平台能力' })).toBeInTheDocument()

    const compass = screen.getByRole('link', { name: /高歌跨境 ERP/ })
    expect(compass).toHaveAttribute('href', 'https://compass.gaoge.cc')
    expect(compass).toHaveAttribute('target', '_blank')
    expect(compass).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.queryByRole('link', { name: /高歌通用 ERP/ })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: '返回高歌首页' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: '进入高歌内容' })).toHaveAttribute('href', '/content')
    expect(screen.getByRole('link', { name: '数字' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: '内容' })).toHaveAttribute('href', '/content')
    expect(screen.getByRole('link', { name: '体育' })).toHaveAttribute(
      'href',
      'https://sports.gaoge.cc',
    )
    expect(document.title).toBe('高歌数字 - 数字产品矩阵')
  })
})

describe('content matrix route', () => {
  it('renders content properties, platforms and capabilities', async () => {
    renderRoute('/content')

    expect(await screen.findByRole('heading', { name: 'GAOGE CONTENT' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '让每一份热爱持续被看见。' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '高歌体育' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '高歌超级联赛' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '主理人个人 IP' })).toBeInTheDocument()
    ;['公众号', '视频号', '小红书', '抖音', 'B 站', '社群与私域'].forEach((platform) => {
      expect(screen.getAllByText(platform).length).toBeGreaterThan(0)
    })
    ;['内容策划', '多平台分发', '数据复盘'].forEach((capability) => {
      expect(screen.getByText(capability)).toBeInTheDocument()
    })

    const sports = screen.getByRole('link', { name: /高歌体育/ })
    expect(sports).toHaveAttribute('href', 'https://sports.gaoge.cc')
    expect(sports).toHaveAttribute('target', '_blank')
    expect(sports).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.queryByRole('link', { name: /高歌超级联赛/ })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: '返回高歌首页' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: '进入高歌数字' })).toHaveAttribute('href', '/digital')
    expect(screen.getByRole('link', { name: '内容' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: '数字' })).toHaveAttribute('href', '/digital')
    expect(document.title).toBe('高歌内容 - 内容运营矩阵')
  })

  it('updates metadata when crossing between formal brand pages', async () => {
    renderRoute('/digital')

    expect(await screen.findByRole('heading', { name: 'GAOGE DIGITAL' })).toBeInTheDocument()
    expect(document.title).toBe('高歌数字 - 数字产品矩阵')

    fireEvent.click(screen.getByRole('link', { name: '进入高歌内容' }))

    expect(await screen.findByRole('heading', { name: 'GAOGE CONTENT' })).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/content')
    expect(document.title).toBe('高歌内容 - 内容运营矩阵')
  })
})

describe('Creator concept route', () => {
  it('renders the complete concept at its dedicated path', async () => {
    const { container } = renderRoute('/concepts/creator')

    expect(await screen.findByRole('heading', { name: /hi, i'm jack/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /^about me$/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /^services$/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /^project$/i })).toBeInTheDocument()

    const sections = Array.from(container.querySelectorAll('main > section'))
    expect(sections).toHaveLength(5)
    expect(sections.map((section) => section.id || section.getAttribute('aria-label'))).toEqual([
      'hero',
      'Selected animated work',
      'about',
      'services',
      'projects',
    ])

    navigationItems.forEach((item) => {
      expect(screen.getByRole('button', { name: item.label })).toBeInTheDocument()
      expect(document.getElementById(item.targetId)).toBeInTheDocument()
    })
  })

  it('keeps all content visible when reduced motion is requested', async () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches: query === '(prefers-reduced-motion)',
      media: query,
      onchange: null,
      removeEventListener: vi.fn(),
      removeListener: vi.fn(),
    }))

    renderRoute('/concepts/creator')

    const aboutCopy = await screen.findByLabelText(/more than five years of experience/i)

    expect(aboutCopy).toBeInTheDocument()
    expect(screen.getByText('3D Modeling')).toBeInTheDocument()
    expect(screen.getByText('Solaris Digital')).toBeInTheDocument()
  })
})

describe('Coding concept route', () => {
  it('renders the supplied three-section landing page at its dedicated path', async () => {
    const { container } = renderRoute('/concepts/coding')

    expect(await screen.findByRole('heading', { name: 'Prisma' })).toBeInTheDocument()
    expect(screen.getByText('Visual arts')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        name: /studio-grade workflows for visionary creators/i,
      }),
    ).toBeInTheDocument()
    expect(container.querySelectorAll('main > section')).toHaveLength(3)
  })
})

describe('legacy concept routes', () => {
  it.each([
    ['/concepts/securify', '/concepts/skiing'],
    ['/concepts/prisma', '/concepts/coding'],
    ['/concepts/jack-3d', '/concepts/creator'],
  ])('redirects %s to %s', async (from, to) => {
    renderRoute(from)

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent(to)
    })
  })
})
