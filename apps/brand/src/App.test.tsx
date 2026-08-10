import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import App from '@/App'
import { navigationItems } from '@/concepts/creator/data'

class PointerEventMock extends MouseEvent {
  readonly pointerId: number
  readonly pointerType: string

  constructor(type: string, init: PointerEventInit = {}) {
    super(type, init)
    this.pointerId = init.pointerId ?? 0
    this.pointerType = init.pointerType ?? 'mouse'
  }
}

function LocationDisplay() {
  const location = useLocation()

  return (
    <output data-state={JSON.stringify(location.state)} data-testid="location">
      {location.pathname}
    </output>
  )
}

function HistoryControls() {
  const navigate = useNavigate()

  return (
    <button onClick={() => navigate(-1)} type="button">
      测试返回
    </button>
  )
}

function renderRoute(entry: string | { pathname: string; state?: unknown }) {
  return render(
    <MemoryRouter
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
      initialEntries={[entry]}
    >
      <App />
      <LocationDisplay />
      <HistoryControls />
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
    const homeLink = screen.getByRole('link', { name: '高歌首页' })
    const groupLink = screen.getByRole('link', { name: '高歌集团' })

    expect(homeLink).toHaveTextContent('GAOGE')
    expect(within(homeLink).getByText('G')).toHaveClass('text-[14px]', '-rotate-[30deg]')
    expect(screen.queryByRole('link', { name: '集团' })).not.toBeInTheDocument()
    expect(groupLink).toHaveAttribute('href', '/group')
    expect(groupLink).toHaveClass('home-group-link')
    expect(groupLink).toHaveTextContent('集团')
    expect(screen.getByText(/享受你的热爱/)).toBeInTheDocument()
    expect(
      screen.getByText(/以数字产品、内容运营与影视制作创造价值，也让体育热爱持续发生/),
    ).toBeInTheDocument()
    ;[
      'DIGITAL',
      'CONTENT',
      'FILM',
      'SPORTS',
      '数字产品',
      '内容运营',
      '影视制作',
      '体育社区',
    ].forEach((label) => expect(screen.getByText(label)).toBeInTheDocument())

    const digitalButton = screen.getByRole('button', { name: '数字' })
    const contentButton = screen.getByRole('button', { name: '内容' })
    const filmButton = screen.getByRole('button', { name: '影视' })
    const sportsButton = screen.getByRole('button', { name: '体育' })

    expect(digitalButton).toHaveAttribute('aria-haspopup', 'dialog')
    expect(contentButton).toHaveAttribute('aria-haspopup', 'dialog')
    expect(filmButton).toHaveAttribute('aria-haspopup', 'dialog')
    expect(sportsButton).toHaveAttribute('aria-haspopup', 'dialog')
    expect(screen.queryByRole('button', { name: '未来' })).not.toBeInTheDocument()
    ;[digitalButton, contentButton, filmButton, sportsButton].forEach((button) => {
      expect(button).toHaveClass('hover:text-white')
      expect(button).not.toHaveClass('hover:bg-white/10')
    })
    for (const oldLinkName of ['进入数字产品', '进入内容创造', '进入高歌体育']) {
      expect(screen.queryByRole('link', { name: oldLinkName })).not.toBeInTheDocument()
    }

    expect(screen.queryAllByText('暂未开放')).toHaveLength(0)
    expect(hero?.querySelector('[aria-disabled="true"]')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '打开高歌品牌能力说明' })).not.toBeInTheDocument()
    for (const name of [
      '打开体育能力说明',
      '打开数字能力说明',
      '打开影视能力说明',
      '打开内容能力说明',
    ]) {
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
    expect(screen.queryByRole('button', { name: '暂停背景视频' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '播放背景视频' })).not.toBeInTheDocument()
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
    expect(within(dialog).getByTestId('capability-dismiss-area')).toHaveClass(
      'items-center',
      'justify-center',
    )
    expect(within(dialog).getByTestId('capability-dismiss-area')).not.toHaveClass('items-end')
    expect(within(dialog).queryByRole('link')).not.toBeInTheDocument()

    fireEvent.wheel(screen.getByTestId('group-swipe-viewport'), { deltaY: 240 })
    expect(screen.getByTestId('location')).toHaveTextContent('/')

    fireEvent.click(within(dialog).getByRole('button', { name: '内容' }))
    expect(within(dialog).getByRole('heading', { name: '内容' })).toBeInTheDocument()
    expect(within(dialog).getByText('内容运营')).toBeInTheDocument()
    expect(
      within(dialog).getByText('以创意与内容思维，把热爱转化为持续生长的影响力。'),
    ).toBeInTheDocument()

    fireEvent.click(within(dialog).getByRole('button', { name: '影视' }))
    expect(within(dialog).getByRole('heading', { name: '影视' })).toBeInTheDocument()
    expect(within(dialog).getByText('影像创作')).toBeInTheDocument()
    expect(
      within(dialog).getByText('以影像与叙事思维，把想法转化为承载情感与表达的光影作品。'),
    ).toBeInTheDocument()

    fireEvent.click(within(dialog).getByRole('button', { name: '体育' }))
    expect(within(dialog).getByRole('heading', { name: '体育' })).toBeInTheDocument()
    expect(within(dialog).getByText('体育生态')).toBeInTheDocument()
    expect(
      within(dialog).getByText('以运动与连接的力量，把热爱转化为真实发生的共同体验。'),
    ).toBeInTheDocument()
  })

  it.each([
    ['button', '上滑了解高歌集团'],
    ['link', '高歌集团'],
  ] as const)('enters the group route from the homepage %s entry', async (role, name) => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        addEventListener: vi.fn(),
        addListener: vi.fn(),
        dispatchEvent: vi.fn(),
        matches: query.includes('prefers-reduced-motion'),
        media: query,
        onchange: null,
        removeEventListener: vi.fn(),
        removeListener: vi.fn(),
      })),
    })
    renderRoute('/')

    fireEvent.click(await screen.findByRole(role, { name }))

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/group'))
    expect(await screen.findByRole('heading', { name: 'GAOGE GROUP' })).toBeInTheDocument()
    expect(document.querySelector('video')).not.toBeInTheDocument()
    expect(screen.getByTestId('group-swipe-group-layer')).not.toHaveAttribute('aria-hidden')
    expect(screen.getByTestId('group-swipe-group-layer')).not.toHaveAttribute('inert')
  })

  it('enters the group route from a mobile swipe on noninteractive homepage content', async () => {
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 844 })
    Object.defineProperty(window, 'PointerEvent', {
      configurable: true,
      value: PointerEventMock,
    })
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        addEventListener: vi.fn(),
        addListener: vi.fn(),
        dispatchEvent: vi.fn(),
        matches: query === '(pointer: coarse)',
        media: query,
        onchange: null,
        removeEventListener: vi.fn(),
        removeListener: vi.fn(),
      })),
    })
    renderRoute('/')
    const heading = await screen.findByRole('heading', { name: 'enjoy your passion' })

    fireEvent.pointerDown(heading, { clientY: 700, pointerId: 1, pointerType: 'touch' })
    fireEvent.pointerMove(heading, { clientY: 548, pointerId: 1, pointerType: 'touch' })
    fireEvent.pointerUp(heading, { clientY: 548, pointerId: 1, pointerType: 'touch' })

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/group'))
    expect(await screen.findByRole('heading', { name: 'GAOGE GROUP' })).toBeInTheDocument()
    expect(screen.getByTestId('group-swipe-group-layer')).not.toHaveAttribute('aria-hidden')
  })

  it.each([
    ['打开体育能力说明', '体育'],
    ['打开数字能力说明', '数字'],
    ['打开影视能力说明', '影视'],
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

  it('closes from the close button or outside area but stays open for panel clicks', async () => {
    renderRoute('/')

    fireEvent.click(await screen.findByRole('button', { name: '数字' }))
    fireEvent.click(screen.getByRole('button', { name: '关闭能力说明' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: '内容' }))
    const dialog = screen.getByRole('dialog')
    fireEvent.click(within(dialog).getByTestId('capability-panel'))
    expect(dialog).toHaveAttribute('open')

    fireEvent.click(within(dialog).getByTestId('capability-dismiss-area'))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('can retarget the capability dialog while it is closing', async () => {
    renderRoute('/')

    const trigger = await screen.findByRole('button', { name: '数字' })
    fireEvent.click(trigger)
    fireEvent.click(screen.getByRole('button', { name: '关闭能力说明' }))

    const dialog = screen.getByRole('dialog')
    const contentButton = within(dialog).getByRole('button', { name: '内容' })

    expect(contentButton).not.toBeDisabled()
    fireEvent.click(contentButton)
    expect(within(dialog).getByRole('heading', { name: '内容' })).toBeInTheDocument()
    expect(dialog).toHaveAttribute('open')

    fireEvent.click(within(dialog).getByRole('button', { name: '关闭能力说明' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
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
    ['/group', 'GAOGE GROUP'],
  ])('keeps %s as a formal brand route', async (path, heading) => {
    renderRoute(path)

    expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent(path)
  })
})

describe('group organization route', () => {
  it('restores the homepage at the top without a handoff overlay', async () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        addEventListener: vi.fn(),
        addListener: vi.fn(),
        dispatchEvent: vi.fn(),
        matches: query.includes('prefers-reduced-motion'),
        media: query,
        onchange: null,
        removeEventListener: vi.fn(),
        removeListener: vi.fn(),
      })),
    })
    renderRoute('/')

    fireEvent.click(await screen.findByRole('button', { name: '上滑了解高歌集团' }))
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/group'))

    fireEvent.click(screen.getByRole('button', { name: '测试返回' }))
    expect(await screen.findByRole('heading', { name: 'enjoy your passion' })).toBeInTheDocument()
    expect(scrollTo).toHaveBeenLastCalledWith({ left: 0, top: 0 })
    expect(screen.queryByTestId('group-route-handoff')).not.toBeInTheDocument()
  })

  it('does not add a transition handoff to direct group visits', async () => {
    renderRoute('/group')

    expect(await screen.findByRole('heading', { name: 'GAOGE GROUP' })).toBeInTheDocument()
    expect(screen.queryByTestId('group-route-handoff')).not.toBeInTheDocument()
  })

  it('restores the prior group scroll position after returning from a module page', async () => {
    let scrollY = 0
    const originalScrollY = Object.getOwnPropertyDescriptor(window, 'scrollY')
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)

    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      get: () => scrollY,
    })

    try {
      renderRoute('/group')
      expect(await screen.findByRole('heading', { name: 'GAOGE GROUP' })).toBeInTheDocument()
      scrollY = 1460
      fireEvent.scroll(window)

      fireEvent.click(screen.getByRole('link', { name: '进入高歌内容' }))
      expect(await screen.findByRole('heading', { name: 'GAOGE CONTENT' })).toBeInTheDocument()
      expect(scrollTo).toHaveBeenLastCalledWith({ left: 0, top: 0 })
      scrollY = 0
      fireEvent.scroll(window)

      fireEvent.click(screen.getByRole('button', { name: '测试返回' }))
      expect(await screen.findByRole('heading', { name: 'GAOGE GROUP' })).toBeInTheDocument()
      await waitFor(() => {
        expect(scrollTo).toHaveBeenLastCalledWith({ left: 0, top: 1460 })
      })
    } finally {
      if (originalScrollY) Object.defineProperty(window, 'scrollY', originalScrollY)
    }
  })

  it('renders the public group structure and metadata', async () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches: query === '(min-width: 768px)',
      media: query,
      onchange: null,
      removeEventListener: vi.fn(),
      removeListener: vi.fn(),
    }))

    renderRoute('/group')

    expect(await screen.findByRole('heading', { name: 'GAOGE GROUP' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '连接热爱，奔赴所爱。' })).toBeInTheDocument()
    const groupNavigation = screen.getByRole('navigation', { name: '高歌品牌导航' })
    const groupHomeLink = within(groupNavigation).getByRole('link', { name: '高歌首页' })
    const groupMark = within(groupHomeLink).getByText('G')

    expect(groupNavigation).toHaveClass(
      'h-[52px]',
      'max-w-[1440px]',
      'brand-group-navigation',
      'md:h-14',
    )
    expect(groupNavigation.closest('header')).toHaveClass('sticky')
    expect(groupNavigation.closest('main')).toHaveClass('overflow-x-clip')
    expect(groupMark).toHaveClass('text-[14px]', '-rotate-[30deg]')
    expect(within(groupNavigation).queryByRole('link', { name: '集团' })).not.toBeInTheDocument()
    expect(within(groupNavigation).getByText('集团')).toBeInTheDocument()
    const sectionNavigation =
      groupNavigation.querySelector<HTMLElement>('[aria-label="集团页面章节"]')

    expect(sectionNavigation).toBeInTheDocument()

    const activeSectionLink = within(sectionNavigation!).getByRole('link', { name: '概览' })

    expect(activeSectionLink).toHaveAttribute('aria-current', 'location')
    expect(activeSectionLink).toHaveClass('group-section-navigation-link--active')
    ;['数字', '内容', '体育', '管理层', '董事会', '愿景'].forEach((section) => {
      expect(within(sectionNavigation!).getByRole('link', { name: section })).toHaveAttribute(
        'href',
        expect.stringMatching(/^#group-/),
      )
    })
    ;[
      'group-overview',
      'group-digital',
      'group-content',
      'group-sports',
      'group-leadership',
      'group-board',
      'group-vision',
    ].forEach((id) => {
      expect(document.getElementById(id)).toHaveClass('group-page-section')
    })
    expect(screen.getByTestId('location')).toHaveTextContent('/group')
    expect(document.title).toBe('高歌集团 - 让热爱持续生长')
    expect(within(groupNavigation).queryByRole('button')).not.toBeInTheDocument()
    expect(within(groupNavigation).queryByText('影视')).not.toBeInTheDocument()
    ;['digital', 'content', 'film', 'sports'].forEach((industry) => {
      expect(document.querySelector(`[data-industry="${industry}"]`)?.tagName).toBe('ARTICLE')
    })
    expect(screen.getAllByText('高歌影视').length).toBeGreaterThan(0)
    ;['产品矩阵', '内容运营', '影像创作', '体育生态'].forEach((direction) => {
      expect(screen.getByText(direction)).toBeInTheDocument()
    })
    ;[
      '以技术与产品思维，把想法转化为面向未来的数字能力。',
      '以创意与内容思维，把热爱转化为持续生长的影响力。',
      '以影像与叙事思维，把想法转化为承载情感与表达的光影作品。',
      '以运动与连接的力量，把热爱转化为真实发生的共同体验。',
    ].forEach((statement) => {
      expect(screen.getByText(statement)).toBeInTheDocument()
    })
    expect(screen.queryByText('高歌小绿本')).not.toBeInTheDocument()
    expect(screen.queryByText('未来领域')).not.toBeInTheDocument()

    expect(screen.getByText('以数字连接业务')).toBeInTheDocument()
    const digitalHeading = screen.getByRole('heading', { name: '高歌数字' })
    const contentHeading = screen.getByRole('heading', { name: '高歌内容' })
    const sportsHeading = screen.getByRole('heading', { name: '高歌体育' })
    const digitalEntry = screen.getByRole('link', { name: '进入高歌数字' })
    const contentEntry = screen.getByRole('link', { name: '进入高歌内容' })
    const sportsEntry = screen.getByRole('link', { name: '进入高歌体育' })
    expect(digitalEntry).toHaveAttribute('href', '/digital')
    expect(contentEntry).toHaveAttribute('href', '/content')
    expect(sportsEntry).toHaveAttribute('href', 'https://sports.gaoge.cc')
    expect(sportsEntry).toHaveAttribute('target', '_blank')
    expect(sportsEntry).toHaveAttribute('rel', 'noopener noreferrer')
    const moduleHeaders: Array<[HTMLElement, HTMLElement, HTMLElement]> = [
      [screen.getByText('以数字连接业务'), digitalEntry, digitalHeading],
      [screen.getByText('以内容连接热爱'), contentEntry, contentHeading],
      [screen.getByText('因热爱相聚'), sportsEntry, sportsHeading],
    ]
    moduleHeaders.forEach(([eyebrow, entry, heading]) => {
      expect(heading.parentElement).toContainElement(entry)
      expect(heading.parentElement).not.toContainElement(eyebrow)
    })
    expect(screen.getByTestId('group-content-card').tagName).toBe('ARTICLE')
    expect(screen.getByTestId('group-content-card').querySelector('a')).not.toBeInTheDocument()
    expect(digitalHeading.compareDocumentPosition(contentHeading)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
    expect(contentHeading.compareDocumentPosition(sportsHeading)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
    expect(
      screen.getByText('从真实业务出发，把复杂流程变成清晰、可持续使用的数字产品。'),
    ).toBeInTheDocument()

    const digitalProductCards = screen.getAllByTestId('group-digital-product')
    expect(digitalProductCards).toHaveLength(3)
    expect(digitalProductCards.map((card) => card.getAttribute('data-product'))).toEqual([
      'compass',
      'crm',
      'club',
    ])
    expect(digitalProductCards[0]).toHaveAttribute('data-emphasis', 'primary')
    expect(digitalProductCards[0]).toHaveClass('h-72', 'lg:row-span-2', 'lg:h-full')
    expect(
      digitalProductCards.slice(1).every((card) => card.dataset.emphasis === 'secondary'),
    ).toBe(true)
    digitalProductCards.slice(1).forEach((card) => {
      expect(card).toHaveClass('h-36', 'lg:col-span-5', 'lg:h-full')
    })
    ;[
      ['高歌跨境 ERP', 'https://compass.gaoge.cc?demo'],
      ['高歌客户 CRM', 'https://crm.gaoge.cc?demo'],
      ['高歌 Club', 'https://club.gaoge.cc?demo'],
    ].forEach(([name, href]) => {
      const link = screen.getByRole('link', {
        name: `${name}，进入演示系统，将在新窗口打开`,
      })
      expect(link).toHaveAttribute('href', href)
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })

    expect(screen.getAllByText('演示系统')).toHaveLength(3)
    expect(screen.queryByText('我们可以提供')).not.toBeInTheDocument()
    expect(screen.queryByTestId('group-digital-capability')).not.toBeInTheDocument()

    expect(screen.getByText('因热爱相聚')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '高歌体育' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '高歌足球俱乐部' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '高歌超级联赛' })).toBeInTheDocument()
    const sportsCards = screen.getAllByTestId('group-sports-entity')
    expect(sportsCards).toHaveLength(2)
    sportsCards.forEach((card) => {
      expect(card.tagName).toBe('ARTICLE')
      expect(card.querySelector('a')).not.toBeInTheDocument()
      expect(card).toHaveClass(
        'hover:-translate-y-1',
        'hover:border-white/25',
        'active:scale-[0.985]',
      )
    })
    expect(screen.getByRole('heading', { name: '集团管理层' })).toBeInTheDocument()
    expect(screen.getByText('从集团方向到球队与联赛，我们一起让热爱持续向前。')).toBeInTheDocument()
    expect(screen.getAllByTestId('group-leader')).toHaveLength(3)
    expect(screen.getByText('集团主席')).toBeInTheDocument()
    expect(screen.getByText('高歌足球俱乐部 CEO')).toBeInTheDocument()
    expect(screen.getByText('高歌超级联赛运营负责人')).toBeInTheDocument()

    expect(screen.getByRole('heading', { name: '联赛董事会' })).toBeInTheDocument()
    expect(screen.getByText('本届董事会成员')).toBeInTheDocument()
    expect(
      screen.getByText('20 位本届联赛董事会成员以热爱和投入，共同推动联赛持续向前。'),
    ).toBeInTheDocument()
    expect(screen.getAllByTestId('league-director')).toHaveLength(20)
    expect(
      document.querySelectorAll('[data-testid="league-director"] [data-testid="default-avatar"]'),
    ).toHaveLength(20)
    expect(screen.getAllByTestId('default-avatar')).toHaveLength(23)

    expect(screen.getByRole('heading', { name: '集团愿景' })).toBeInTheDocument()
    expect(screen.getByText('让每一份热爱，都有持续生长的可能。')).toBeInTheDocument()
    ;['因热爱出发', '让想法发生', '与伙伴同行'].forEach((title) => {
      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument()
    })

    const pageCopy = document.body.textContent ?? ''

    ;[
      '非营利',
      '商业',
      '企业服务能力',
      '集团协同交付',
      '独立采购',
      '集团统筹',
      '体育内部支持',
    ].forEach((term) => {
      expect(pageCopy).not.toContain(term)
    })

    expect(screen.queryByRole('heading', { name: '持续生长中的新领域' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: '返回高歌首页' })).toHaveAttribute('href', '/')
  })

  it('condenses the group section navigation on mobile', async () => {
    renderRoute('/group')

    expect(await screen.findByRole('heading', { name: 'GAOGE GROUP' })).toBeInTheDocument()
    const sectionNavigation = screen.getByLabelText('集团页面章节')

    expect(
      within(sectionNavigation)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['概览', '数字', '内容', '体育', '集团'])
    expect(within(sectionNavigation).getByRole('link', { name: '内容' })).toHaveAttribute(
      'href',
      '#group-content',
    )
    expect(within(sectionNavigation).getByRole('link', { name: '集团' })).toHaveAttribute(
      'href',
      '#group-leadership',
    )
  })
})

describe('digital matrix route', () => {
  it('renders current products and future plans with truthful link behavior', async () => {
    renderRoute('/digital')

    expect(await screen.findByRole('heading', { name: 'GAOGE DIGITAL' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '让复杂业务，运行得更清晰。' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '当前产品' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '未来产品规划' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '产品如何被交付' })).toBeInTheDocument()
    expect(screen.getByText('高歌跨境 ERP')).toBeInTheDocument()
    expect(screen.getByText('高歌 Club')).toBeInTheDocument()
    expect(screen.getByText('高歌客户 CRM')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '企业软件' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '消费者产品' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '平台能力' })).toBeInTheDocument()
    const demoStatuses = screen.getAllByText('演示系统')
    const plannedStatuses = screen.getAllByText('规划中')
    const matrixStatuses = [...demoStatuses, ...plannedStatuses]

    expect(demoStatuses).toHaveLength(3)
    expect(plannedStatuses).toHaveLength(3)
    matrixStatuses.forEach((status) => {
      expect(status).toHaveClass('border-white/10', 'text-white/45')
    })
    expect(screen.getByText('多端交付')).toBeInTheDocument()
    expect(screen.getByText('后续 SaaS')).toBeInTheDocument()

    const digitalProductDestinations = [
      ['高歌跨境 ERP', 'https://compass.gaoge.cc?demo'],
      ['高歌客户 CRM', 'https://crm.gaoge.cc?demo'],
      ['高歌 Club', 'https://club.gaoge.cc?demo'],
    ] as const

    digitalProductDestinations.forEach(([name, href]) => {
      const productLink = screen.getByRole('link', { name: new RegExp(name) })

      expect(productLink).toHaveAttribute('href', href)
      expect(productLink).toHaveAttribute('target', '_blank')
      expect(productLink).toHaveAttribute('rel', 'noopener noreferrer')
    })
    expect(screen.getByText('高歌经营 ERP')).toBeInTheDocument()
    expect(screen.getByText('连接采购、销售、库存与财务等企业核心经营流程。')).toBeInTheDocument()
    expect(screen.queryByText('高歌通用 ERP')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: '返回高歌首页' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: '进入高歌内容' })).toHaveAttribute('href', '/content')

    const sectionNavigation = screen.getByLabelText('数字页面章节')

    const sectionDestinations = [
      ['概览', '概览', '#digital-overview'],
      ['当前产品', '产品', '#digital-current'],
      ['产品规划', '规划', '#digital-roadmap'],
      ['交付能力', '能力', '#digital-delivery'],
    ] as const

    sectionDestinations.forEach(([label, mobileLabel, href]) => {
      const link = within(sectionNavigation).getByRole('link', { name: label })

      expect(link).toHaveAttribute('href', href)
      expect(within(link).getByText(mobileLabel, { selector: '.md\\:hidden' })).toBeInTheDocument()
    })
    expect(within(screen.getByLabelText('高歌品牌导航')).getByText('数字')).toBeInTheDocument()
    expect(document.title).toBe('高歌数字 - 数字产品矩阵')
  })
})

describe('content capability route', () => {
  it('renders the complete non-navigational capability showcase', async () => {
    const { container } = renderRoute('/content')

    expect(await screen.findByRole('heading', { name: 'GAOGE CONTENT' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '让每一份热爱持续被看见。' })).toBeInTheDocument()
    expect(screen.getByText('以内容与运营连接品牌、平台和真实社群。')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        name: '内容不是一次传播。它让故事持续发生，让关系慢慢留下。',
      }),
    ).toBeInTheDocument()
    ;['内容策略', '内容创作', '全平台运营', '社群连接'].forEach((capability) => {
      expect(screen.getByRole('heading', { name: capability })).toBeInTheDocument()
    })
    expect(
      screen.getByRole('heading', { name: '让一次被看见，成为持续发生的关系。' }),
    ).toBeInTheDocument()
    expect(screen.queryByText('真实实践')).not.toBeInTheDocument()
    expect(screen.queryByText('内容形态')).not.toBeInTheDocument()
    expect(screen.queryByText('工作方法')).not.toBeInTheDocument()
    expect(container.querySelector('video')).not.toBeInTheDocument()
    expect(container.querySelectorAll('[data-status]')).toHaveLength(0)
    expect(container.querySelectorAll('main img')).toHaveLength(1)
    expect(container.querySelector('.content-page-section a')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: '返回高歌首页' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: '进入高歌数字' })).toHaveAttribute('href', '/digital')
    const sectionNavigation = screen.getByLabelText('内容页面章节')
    const sectionDestinations = [
      ['主张', '主张', '#content-overview'],
      ['内容理念', '理念', '#content-belief'],
      ['核心能力', '能力', '#content-capabilities'],
    ] as const

    sectionDestinations.forEach(([label, mobileLabel, href]) => {
      const link = within(sectionNavigation).getByRole('link', { name: label })

      expect(link).toHaveAttribute('href', href)
      expect(within(link).getByText(mobileLabel, { selector: '.md\\:hidden' })).toBeInTheDocument()
    })
    expect(
      within(screen.getByLabelText('高歌品牌导航')).getByText('内容', {
        selector: 'span.hidden',
      }),
    ).toBeInTheDocument()
    expect(document.title).toBe('高歌内容 - 内容创作与全平台运营')
  })

  it('updates metadata when crossing between formal brand pages', async () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)

    renderRoute('/digital')

    expect(await screen.findByRole('heading', { name: 'GAOGE DIGITAL' })).toBeInTheDocument()
    expect(document.title).toBe('高歌数字 - 数字产品矩阵')

    fireEvent.click(screen.getByRole('link', { name: '进入高歌内容' }))

    expect(await screen.findByRole('heading', { name: 'GAOGE CONTENT' })).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/content')
    expect(document.title).toBe('高歌内容 - 内容创作与全平台运营')
    expect(scrollTo).toHaveBeenLastCalledWith({ left: 0, top: 0 })
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
