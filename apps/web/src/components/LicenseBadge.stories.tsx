import { License } from '@promptmarket/shared'

import LicenseBadge from './LicenseBadge'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'Badges/LicenseBadge',
  component: LicenseBadge,
  argTypes: {
    license: { control: 'inline-radio', options: License.options },
  },
  args: { license: 'MIT' },
} satisfies Meta<typeof LicenseBadge>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const AllLicenses: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {License.options.map((l) => (
        <LicenseBadge key={l} license={l} />
      ))}
    </div>
  ),
}
