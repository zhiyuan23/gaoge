import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import GroupPage, { type GroupEntryPresentation } from '@/pages/group/GroupPage'

function renderGroup(entryPresentation: GroupEntryPresentation = 'direct') {
  return render(
    <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <GroupPage entryPresentation={entryPresentation} />
    </MemoryRouter>,
  )
}

describe('GroupPage staging', () => {
  it('commits the staged foreground state with the real background intact', () => {
    document.title = '高歌首页'
    renderGroup('staged')

    const page = screen.getByRole('main')
    const background = screen.getByRole('img', {
      name: '深色金属与绿玻璃构成的弧形建筑结构',
    })

    expect(page).toHaveAttribute('data-entry-presentation', 'staged')
    expect(page.querySelector('.group-entry-navigation')).toBeInTheDocument()
    expect(page.querySelector('.group-entry-copy')).toBeInTheDocument()
    expect(page.querySelector('.group-entry-orbit')).toBeInTheDocument()
    expect(background).not.toHaveClass(
      'group-entry-navigation',
      'group-entry-copy',
      'group-entry-orbit',
    )
    expect(document.title).toBe('高歌首页')
  })

  it('owns group metadata when active or direct', () => {
    const view = renderGroup('active')

    expect(document.title).toBe('高歌集团 - 让热爱持续生长')

    view.rerender(
      <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <GroupPage entryPresentation="direct" />
      </MemoryRouter>,
    )

    expect(screen.getByRole('main')).toHaveAttribute('data-entry-presentation', 'direct')
  })
})
