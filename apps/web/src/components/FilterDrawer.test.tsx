import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import FilterDrawer from './FilterDrawer'
import { emptyFilters } from './filterState'

const navigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigate,
  }
})

const SAVED_KEY = 'pm.savedFilters'

beforeEach(() => {
  localStorage.clear()
  navigate.mockClear()
})

function renderDrawer(props?: Partial<React.ComponentProps<typeof FilterDrawer>>) {
  const onOpenChange = vi.fn()
  const onChange = vi.fn()
  const onReset = vi.fn()
  render(
    <MemoryRouter>
      <FilterDrawer
        open
        onOpenChange={onOpenChange}
        value={emptyFilters()}
        onChange={onChange}
        onReset={onReset}
        {...props}
      />
    </MemoryRouter>
  )
  return { onOpenChange, onChange, onReset }
}

describe('<FilterDrawer />', () => {
  it('renders the FilterPanel inside the open drawer', () => {
    renderDrawer()
    // Dialog title + FilterPanel header both render "필터"; check the
    // FilterPanel content showed up via a child section header instead.
    expect(screen.getByText('타입')).toBeTruthy()
  })

  it('closes the drawer when the "필터 적용" button is clicked', () => {
    const { onOpenChange } = renderDrawer()
    fireEvent.click(screen.getByRole('button', { name: /필터 적용/ }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('hides the "최근 필터" section when no saved filters exist', () => {
    renderDrawer()
    expect(screen.queryByText('최근 필터')).toBeNull()
  })

  it('navigates to /browse?<search> when a saved filter chip is clicked', () => {
    localStorage.setItem(
      SAVED_KEY,
      JSON.stringify([
        {
          label: '무료 프롬프트',
          search: 'type=PROMPT&free=true',
          at: Date.now(),
        },
      ])
    )
    const { onOpenChange } = renderDrawer()
    const chip = screen.getByRole('button', { name: /저장된 필터 적용: 무료 프롬프트/ })
    fireEvent.click(chip)
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(navigate).toHaveBeenCalledWith('/browse?type=PROMPT&free=true')
  })

  it('removes a saved filter via the inner X without navigating', () => {
    localStorage.setItem(
      SAVED_KEY,
      JSON.stringify([{ label: '무료', search: 'free=true', at: Date.now() }])
    )
    renderDrawer()
    const removeBtn = screen.getByRole('button', {
      name: /이 저장 필터 지우기/,
    })
    fireEvent.click(removeBtn)
    expect(navigate).not.toHaveBeenCalled()
    expect(JSON.parse(localStorage.getItem(SAVED_KEY) ?? '[]')).toEqual([])
  })
})
