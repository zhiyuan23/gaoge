import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { type MotionValue } from 'framer-motion'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import HomeGroupRouteShell from '@/brand/components/HomeGroupRouteShell'

const moduleSpies = vi.hoisted(() => ({
  groupModuleEvaluated: vi.fn(),
  skiingModuleEvaluated: vi.fn(),
}))

vi.mock('framer-motion', async (importOriginal) => ({
  ...(await importOriginal<typeof import('framer-motion')>()),
  animate: (value: MotionValue<number>, target: number) => {
    value.set(target)
    return Object.assign(Promise.resolve(), { stop: vi.fn() })
  },
  useReducedMotion: () => false,
}))

vi.mock('@/pages/group/GroupPage', () => {
  moduleSpies.groupModuleEvaluated()

  return {
    default: ({ entryPresentation = 'direct' }: { entryPresentation?: string }) => {
      if (entryPresentation !== 'staged') document.title = '高歌集团 - 让热爱持续生长'
      return (
        <main data-entry-presentation={entryPresentation} data-testid="persistent-group-node">
          集团页
        </main>
      )
    },
  }
})

vi.mock('@/concepts/skiing/SkiingPage', () => {
  moduleSpies.skiingModuleEvaluated()

  return {
    default: ({
      onGroupNavigate,
    }: {
      onCapabilityOpenChange?: (open: boolean) => void
      onGroupNavigate?: () => void
    }) => {
      document.title = '高歌首页'
      return (
        <main>
          <h1>enjoy your passion</h1>
          <video aria-label="首页视频" />
          <a
            href="/group"
            onClick={(event) => {
              if (!onGroupNavigate) return
              event.preventDefault()
              onGroupNavigate()
            }}
          >
            高歌集团
          </a>
        </main>
      )
    },
  }
})

function LocationDisplay() {
  return <output data-testid="location">{useLocation().pathname}</output>
}

function renderShellAt(pathname: '/' | '/group') {
  return render(
    <MemoryRouter
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
      initialEntries={[pathname]}
    >
      <Routes>
        <Route element={<HomeGroupRouteShell />}>
          <Route index element={null} />
          <Route path="group" element={null} />
        </Route>
      </Routes>
      <LocationDisplay />
    </MemoryRouter>,
  )
}

describe('HomeGroupRouteShell', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'scrollTo', {
      configurable: true,
      value: vi.fn(),
    })
  })

  it('loads only the group surface for a direct group visit', async () => {
    renderShellAt('/group')

    expect(await screen.findByTestId('persistent-group-node')).toBeInTheDocument()
    expect(moduleSpies.groupModuleEvaluated).toHaveBeenCalledTimes(1)
    expect(moduleSpies.skiingModuleEvaluated).not.toHaveBeenCalled()
    expect(document.querySelector('video')).not.toBeInTheDocument()
    expect(screen.queryByTestId('group-swipe-viewport')).not.toBeInTheDocument()
    expect(screen.getByTestId('persistent-group-node')).toHaveAttribute(
      'data-entry-presentation',
      'direct',
    )
  })

  it('keeps the staged group node through route completion', async () => {
    renderShellAt('/')

    expect(await screen.findByRole('heading', { name: 'enjoy your passion' })).toBeInTheDocument()
    const stagedGroup = await screen.findByTestId('persistent-group-node')
    expect(document.title).toBe('高歌首页')
    expect(screen.getByTestId('group-swipe-group-layer')).toHaveAttribute('inert')
    expect(stagedGroup).toHaveAttribute('data-entry-presentation', 'staged')

    fireEvent.click(screen.getByRole('button', { name: '上滑了解高歌集团' }))
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/group'))

    expect(screen.getByTestId('persistent-group-node')).toBe(stagedGroup)
    expect(stagedGroup).toHaveAttribute('data-entry-presentation', 'active')
    expect(screen.queryByRole('heading', { name: 'enjoy your passion' })).not.toBeInTheDocument()
    expect(screen.getByTestId('group-swipe-group-layer')).not.toHaveAttribute('inert')
    expect(document.querySelector('video')).not.toBeInTheDocument()
    expect(document.title).toBe('高歌集团 - 让热爱持续生长')
  })
})
