import Spinner from './Spinner'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'Feedback/Spinner',
  component: Spinner,
  args: { size: 24 },
  argTypes: {
    size: { control: { type: 'range', min: 12, max: 64, step: 2 } },
  },
} satisfies Meta<typeof Spinner>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithLabel: Story = {
  args: { label: '불러오는 중…' },
}

export const Large: Story = {
  args: { size: 48 },
}
