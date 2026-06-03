import type { Meta, StoryObj } from '@storybook/react-vite'
import { Difficulty } from '@promptmarket/shared'
import DifficultyBadge from './DifficultyBadge'

const meta = {
  title: 'Badges/DifficultyBadge',
  component: DifficultyBadge,
  argTypes: {
    difficulty: { control: 'inline-radio', options: Difficulty.options },
  },
  args: { difficulty: 'beginner' },
} satisfies Meta<typeof DifficultyBadge>

export default meta
type Story = StoryObj<typeof meta>

export const Beginner: Story = { args: { difficulty: 'beginner' } }
export const Intermediate: Story = { args: { difficulty: 'intermediate' } }
export const Advanced: Story = { args: { difficulty: 'advanced' } }

export const AllLevels: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {Difficulty.options.map((d) => (
        <DifficultyBadge key={d} difficulty={d} />
      ))}
    </div>
  ),
}
