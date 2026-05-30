import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import TypeBadge from './TypeBadge'
import ModelBadge from './ModelBadge'
import DifficultyBadge from './DifficultyBadge'
import LicenseBadge from './LicenseBadge'
import TechniqueBadge from './TechniqueBadge'

describe('<TypeBadge />', () => {
  it('renders the localized label for PROMPT', () => {
    render(<TypeBadge type="PROMPT" />)
    expect(screen.getByText('프롬프트')).toBeTruthy()
  })

  it('renders the localized label for SKILL', () => {
    render(<TypeBadge type="SKILL" />)
    expect(screen.getByText('스킬')).toBeTruthy()
  })

  it('switches to overlay styling when overlay=true', () => {
    const { container } = render(<TypeBadge type="PROMPT" overlay />)
    expect(container.querySelector('.backdrop-blur')).not.toBeNull()
  })
})

describe('<ModelBadge />', () => {
  it('resolves a known model slug to its display label', () => {
    render(<ModelBadge slug="claude-opus-4-7" />)
    // The label comes from MODELS — checking the slug-display lookup is
    // wired rather than the exact string (which the registry owns).
    const span = document.querySelector('span[title]')
    expect(span).not.toBeNull()
    expect(span?.textContent?.length).toBeGreaterThan(0)
  })

  it('shows the vendor as a title attribute for tooltips', () => {
    render(<ModelBadge slug="claude-opus-4-7" />)
    const span = document.querySelector('span[title]')
    expect(span?.getAttribute('title')).not.toBe('')
  })

  it('falls back gracefully for an unknown slug', () => {
    render(<ModelBadge slug="zzz-mystery-model" />)
    // Should render the slug itself or a similar identifier — never crash.
    const span = document.querySelector('span[title]')
    expect(span).not.toBeNull()
  })
})

describe('<DifficultyBadge />', () => {
  it('renders the Korean label for each level', () => {
    const { rerender } = render(<DifficultyBadge difficulty="beginner" />)
    expect(screen.getByText(/입문/)).toBeTruthy()
    rerender(<DifficultyBadge difficulty="intermediate" />)
    expect(screen.getByText(/중급/)).toBeTruthy()
    rerender(<DifficultyBadge difficulty="advanced" />)
    expect(screen.getByText(/고급/)).toBeTruthy()
  })
})

describe('<LicenseBadge />', () => {
  it('renders the license name', () => {
    render(<LicenseBadge license="MIT" />)
    expect(screen.getByText('MIT')).toBeTruthy()
  })
})

describe('<TechniqueBadge />', () => {
  it('renders the technique meta label', () => {
    render(<TechniqueBadge technique="chain-of-thought" />)
    // The exact label is owned by TECHNIQUE_META; we just confirm something
    // shows up rather than the raw slug.
    expect(screen.queryByText(/chain-of-thought/)).toBeNull()
    const text = document.querySelector('span')?.textContent ?? ''
    expect(text.length).toBeGreaterThan(0)
  })
})
