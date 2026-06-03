import { useState } from 'react'
import type { ComponentProps } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import StarRating from './StarRating'

/** Stateful wrapper so the interactive story can hold + update the rating. */
function InteractiveStarRating(args: ComponentProps<typeof StarRating>) {
  const [value, setValue] = useState(args.value)
  return <StarRating {...args} value={value} onChange={setValue} size="lg" />
}

const meta = {
  title: 'Data Display/StarRating',
  component: StarRating,
  argTypes: {
    value: { control: { type: 'range', min: 0, max: 5, step: 0.1 } },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    showLabel: { control: 'boolean' },
  },
  args: { value: 4.5, count: 128, size: 'sm', showLabel: false },
} satisfies Meta<typeof StarRating>

export default meta
type Story = StoryObj<typeof meta>

/** Read-only display (no onChange) — renders as an img with an aria-label. */
export const ReadOnly: Story = {}

export const WithLabel: Story = {
  args: { showLabel: true },
}

export const Large: Story = {
  args: { size: 'lg', value: 3 },
}

/** Interactive radiogroup — supply onChange to enable click + arrow-key input. */
export const Interactive: Story = {
  render: (args) => <InteractiveStarRating {...args} />,
  args: { value: 3, count: undefined },
}
