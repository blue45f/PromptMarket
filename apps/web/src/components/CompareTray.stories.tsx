import CompareTray from './CompareTray'

import type { ListingCard as ListingCardType } from '@/types'
import type { Meta, StoryObj } from '@storybook/react-vite'

/**
 * Sticky bottom tray that holds up to three listings side-by-side for a quick
 * buyer comparison. Returns null when empty. Rendered fixed to the viewport,
 * so these stories use a fullscreen layout. Router comes from the global
 * preview decorator.
 */
const base: ListingCardType = {
  id: 'l1',
  slug: 'alpha-prompt',
  title: 'Alpha Refactor Prompt',
  type: 'PROMPT',
  description: 'First option',
  category: 'Coding',
  tags: [],
  models: ['claude-opus-4-7', 'gpt-5'],
  technique: 'chain-of-thought',
  difficulty: 'intermediate',
  license: 'MIT',
  version: '1.0.0',
  priceCents: 199,
  coverEmoji: '✨',
  downloads: 412,
  avgRating: 4.5,
  reviewCount: 18,
  createdAt: '2026-05-01T00:00:00Z',
  author: { id: 'a1', username: 'author_one' },
}

const second: ListingCardType = {
  ...base,
  id: 'l2',
  slug: 'beta-mcp',
  title: 'Beta MCP Server',
  type: 'MCP_SERVER',
  models: ['any'],
  priceCents: 0,
  coverEmoji: '🔌',
  downloads: 88,
  avgRating: 4.1,
  reviewCount: 6,
  author: { id: 'a2', username: 'author_two' },
}

const third: ListingCardType = {
  ...base,
  id: 'l3',
  slug: 'gamma-skill',
  title: 'Gamma Skill Bundle',
  type: 'SKILL',
  models: ['claude-code', 'cursor'],
  priceCents: 1500,
  coverEmoji: '🧩',
  downloads: 230,
  avgRating: 4.8,
  reviewCount: 27,
  author: { id: 'a3', username: 'author_three' },
}

const meta = {
  title: 'Marketplace/CompareTray',
  component: CompareTray,
  parameters: { layout: 'fullscreen' },
  args: {
    items: [base, second],
    now: new Date('2026-06-01'),
    onRemove: () => {},
    onClear: () => {},
  },
} satisfies Meta<typeof CompareTray>

export default meta
type Story = StoryObj<typeof meta>

/** Two items — enough to compare. */
export const TwoItems: Story = {}

/** A single item shows the "add one more to compare" hint. */
export const SingleItem: Story = {
  args: { items: [base] },
}

/** The maximum of three items. */
export const Full: Story = {
  args: { items: [base, second, third] },
}
