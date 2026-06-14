import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import Highlight from './Highlight'

describe('<Highlight />', () => {
  it('renders the text untouched when query is empty', () => {
    const { container } = render(<Highlight text="안녕 프롬프트" query="" />)
    expect(container.textContent).toBe('안녕 프롬프트')
    expect(container.querySelector('mark')).toBeNull()
  })

  it('wraps every case-insensitive match in <mark>', () => {
    render(<Highlight text="Claude Code makes claude shine" query="claude" />)
    const marks = screen.getAllByText(/claude/i, { selector: 'mark' })
    expect(marks.length).toBe(2)
    // Preserves the original casing inside each mark.
    expect(marks.map((m) => m.textContent)).toEqual(['Claude', 'claude'])
  })

  it('tokenises the query on whitespace', () => {
    render(<Highlight text="agent skill mcp" query="agent  mcp" />)
    const marks = screen.getAllByText(/agent|mcp/i, { selector: 'mark' })
    expect(marks.map((m) => m.textContent)).toEqual(['agent', 'mcp'])
  })

  it('escapes regex-special characters in the query', () => {
    // The query contains `(` and `.` which are regex specials. They should
    // match literally without throwing or accidentally matching every char.
    const { container } = render(<Highlight text="hello (1.0) world" query="(1.0)" />)
    const marks = container.querySelectorAll('mark')
    expect(marks.length).toBe(1)
    expect(marks[0]?.textContent).toBe('(1.0)')
  })

  it('handles an empty text gracefully', () => {
    const { container } = render(<Highlight text="" query="agent" />)
    expect(container.textContent).toBe('')
  })
})
