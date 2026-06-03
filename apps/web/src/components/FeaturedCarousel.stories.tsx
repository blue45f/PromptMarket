import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ListingCard as ListingCardType } from '@/types'
import FeaturedCarousel from './FeaturedCarousel'

/**
 * Horizontally-scrollable, snap-aligned strip of featured ListingCards with
 * edge-fade momentum cues. Returns null when there are no items and not
 * loading. Router + React Query come from the global preview decorator.
 */
function makeListing(i: number): ListingCardType {
  const types = ['PROMPT', 'SKILL', 'MCP_SERVER', 'AGENT_MD', 'CLAUDE_MD'] as const
  return {
    id: `f${i}`,
    slug: `featured-${i}`,
    title: `Featured Listing ${i + 1}`,
    type: types[i % types.length],
    description: 'A highlighted, editor-picked catalog entry shown in the carousel rail.',
    category: 'Coding',
    tags: ['featured'],
    models: ['claude-opus-4-7', 'gpt-5'],
    technique: i % 2 === 0 ? 'chain-of-thought' : null,
    difficulty: 'intermediate',
    license: 'MIT',
    version: '1.0.0',
    priceCents: i % 3 === 0 ? 0 : 199 + i * 100,
    coverEmoji: ['✨', '🧩', '🔌', '🤖', '📘'][i % 5],
    downloads: 100 + i * 37,
    avgRating: 4 + (i % 10) / 10,
    reviewCount: 5 + i,
    createdAt: '2026-05-15T00:00:00Z',
    author: { id: `a${i}`, username: `builder_${i}` },
  }
}

const items = Array.from({ length: 6 }, (_, i) => makeListing(i))

const meta = {
  title: 'Marketplace/FeaturedCarousel',
  component: FeaturedCarousel,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div className="p-8">
        <Story />
      </div>
    ),
  ],
  args: { items },
} satisfies Meta<typeof FeaturedCarousel>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** Loading state renders six skeleton cards. */
export const Loading: Story = {
  args: { items: [], loading: true },
}
