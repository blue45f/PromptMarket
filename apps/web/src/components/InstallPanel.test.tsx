import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import InstallPanel from './InstallPanel'

describe('<InstallPanel />', () => {
  it('shows Claude Code CLI for SKILL listings', () => {
    render(<InstallPanel slug="my-slug" type="SKILL" />)
    expect(screen.getByText('Claude Code')).toBeTruthy()
    expect(screen.queryByText('Windsurf')).toBeNull()
    // The cURL fallback always renders.
    expect(screen.getByText('cURL')).toBeTruthy()
  })

  it('shows MCP JSON config for MCP_SERVER and not editor CLIs', () => {
    render(<InstallPanel slug="my-mcp" type="MCP_SERVER" />)
    expect(screen.getByText('MCP 클라이언트')).toBeTruthy()
    expect(screen.queryByText('Claude Code')).toBeNull()
    expect(screen.queryByText('Cursor')).toBeNull()
  })

  it('shows Cursor + Windsurf for CURSOR_RULES', () => {
    render(<InstallPanel slug="rules" type="CURSOR_RULES" />)
    expect(screen.getByText('Cursor')).toBeTruthy()
    expect(screen.getByText('Windsurf')).toBeTruthy()
  })

  it('renders the cURL fallback for any type', () => {
    render(<InstallPanel slug="x" type="PROMPT" />)
    expect(screen.getByText('cURL')).toBeTruthy()
  })

  it('embeds the slug into the active tab command', () => {
    render(<InstallPanel slug="abc-123" type="SKILL" />)
    expect(screen.getByText(/claude \/install abc-123/)).toBeTruthy()
  })

  it('copies the command to the clipboard when the copy button is clicked', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })
    render(<InstallPanel slug="my-slug" type="SKILL" />)
    const copyBtn = screen.getByRole('button', { name: '명령 복사' })
    fireEvent.click(copyBtn)
    expect(writeText).toHaveBeenCalledWith('claude /install my-slug')
    expect(await screen.findAllByText('복사됨')).toBeTruthy()
  })
})
