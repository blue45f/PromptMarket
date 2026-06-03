import type { Meta, StoryObj } from '@storybook/react-vite'
import SkeletonCard, { SkeletonGrid } from './SkeletonCard'

const meta = {
  title: 'Feedback/SkeletonCard',
  component: SkeletonCard,
  parameters: { layout: 'padded' },
  args: { seed: 0 },
  decorators: [
    (Story) => (
      <div className="w-[280px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SkeletonCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** Different seeds produce deterministically varied shapes so a grid of
 *  skeletons does not read as an obvious repeat. */
export const Seeded: Story = {
  args: { seed: 3 },
}

/** The companion SkeletonGrid renders a fluid grid of placeholder cards. */
export const Grid: StoryObj<typeof SkeletonGrid> = {
  render: (args) => <SkeletonGrid {...args} />,
  args: { count: 8 },
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div className="p-6">
        <Story />
      </div>
    ),
  ],
}
