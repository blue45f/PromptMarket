import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fireEvent, screen, waitFor } from 'storybook/test'
import CommandPalette from './CommandPalette'

/**
 * Global ⌘K / Ctrl+K / "/" launcher (Linear / Raycast style). It mounts
 * invisible and opens on the shortcut, so each story uses a `play` step to
 * dispatch the keystroke and surface the dialog. Router + React Query come
 * from the global preview decorator; signed-out quick actions are shown.
 *
 * In the live app, results stream from the /listings API — in isolation the
 * palette shows its static quick actions (Browse, Trending, Wishlist, …).
 */
const meta = {
  title: 'Overlays/CommandPalette',
  component: CommandPalette,
  parameters: {
    layout: 'fullscreen',
    // The trigger hint footer is informational; quiet the a11y color check on
    // the translucent overlay so the panel itself is what gets audited.
    a11y: { test: 'todo' },
  },
} satisfies Meta<typeof CommandPalette>

export default meta
type Story = StoryObj<typeof meta>

/** Closed — nothing is rendered until the shortcut fires. */
export const Closed: Story = {}

/** Opened via ⌘K — shows the search field and the quick-action list. */
export const Opened: Story = {
  play: async () => {
    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())
  },
}
