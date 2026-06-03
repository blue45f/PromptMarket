import type { Meta, StoryObj } from '@storybook/react-vite'
import { MODEL_SLUGS } from '@promptmarket/shared'
import ModelBadge from './ModelBadge'

const meta = {
  title: 'Badges/ModelBadge',
  component: ModelBadge,
  argTypes: {
    slug: { control: 'select', options: [...MODEL_SLUGS] },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
  },
  args: { slug: 'claude-opus-4-7', size: 'sm' },
} satisfies Meta<typeof ModelBadge>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Medium: Story = { args: { size: 'md' } }

/** Unknown slugs fall back to rendering the raw slug. */
export const UnknownSlug: Story = { args: { slug: 'some-future-model' } }

export const Gallery: Story = {
  render: () => (
    <div className="flex max-w-lg flex-wrap gap-1.5">
      {MODEL_SLUGS.map((slug) => (
        <ModelBadge key={slug} slug={slug} />
      ))}
    </div>
  ),
}
