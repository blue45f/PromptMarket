import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import CreateListingPage from './CreateListingPage'
import i18n from '@/i18n'

vi.mock('@features/marketplace/queries', () => ({
  useCreateListing: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useListings: vi.fn(() => ({ data: { items: [] }, isPending: false })),
}))
vi.mock('@hooks/usePageMeta', () => ({ usePageMeta: vi.fn() }))
vi.mock('@components/ModelPicker', () => ({
  default: ({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) => (
    <div data-testid="model-picker" />
  ),
}))
vi.mock('@components/ListingCard', () => ({
  default: () => <div data-testid="listing-card" />,
}))
vi.mock('@components/MarkdownView', () => ({
  default: () => <div data-testid="markdown-view" />,
}))

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <MemoryRouter>
      <QueryClientProvider client={qc}>
        <CreateListingPage />
      </QueryClientProvider>
    </MemoryRouter>
  )
}

describe('CreateListingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the "기본" tab as active by default', () => {
    renderPage()
    expect(screen.getByRole('tab', { name: '기본' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: '기본' }).getAttribute('data-state')).toBe('active')
  })

  it('renders the "본문" tab button', () => {
    renderPage()
    expect(screen.getByRole('tab', { name: '본문' })).toBeTruthy()
  })

  it('renders the "메타데이터" tab button', () => {
    renderPage()
    expect(screen.getByRole('tab', { name: '메타데이터' })).toBeTruthy()
  })

  it('shows the title input on the basics tab', () => {
    renderPage()
    const input = document.querySelector('input[name="title"]') as HTMLInputElement | null
    expect(input).toBeTruthy()
    expect(input?.placeholder).toBe('SaaS 랜딩 페이지를 위한 살벌한 프롬프트')
  })

  it('shows a live publishing quality checklist for sellers', () => {
    renderPage()
    expect(screen.getByRole('heading', { name: '게시 품질 체크' })).toBeTruthy()
    expect(screen.getByText('0/4')).toBeTruthy()
  })

  it('updates the publishing quality checklist as the seller fills core fields', () => {
    renderPage()
    fireEvent.change(document.querySelector('input[name="title"]') as HTMLInputElement, {
      target: { value: 'Production API Review Prompt' },
    })
    fireEvent.change(
      document.querySelector('textarea[name="description"]') as HTMLTextAreaElement,
      {
        target: {
          value: 'Reviews FastAPI pull requests for security, latency, and database regressions.',
        },
      }
    )
    expect(screen.getByText('1/4')).toBeTruthy()
  })

  it('jumps to the metadata tab and focuses tags field from quality item action', async () => {
    renderPage()
    const metadataTabName = i18n.t('sectionTabs.metadata', { ns: 'create' })
    const jumpToMetadataButton = screen
      .getAllByRole('button', { name: /빠르게|Jump to/ })
      .find((button) => button.textContent?.includes(metadataTabName))

    expect(jumpToMetadataButton).toBeTruthy()
    fireEvent.click(jumpToMetadataButton as Element)

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: metadataTabName }).getAttribute('data-state')).toBe(
        'active'
      )
      expect(document.activeElement?.getAttribute('name')).toBe('tags')
    })
  })

  it('jumps to the content tab and focuses body field from quality item action', async () => {
    renderPage()
    const contentTabName = i18n.t('sectionTabs.content', { ns: 'create' })
    const jumpToContentButton = screen
      .getAllByRole('button', { name: /빠르게|Jump to/ })
      .find((button) => button.textContent?.includes(contentTabName))

    expect(jumpToContentButton).toBeTruthy()
    fireEvent.click(jumpToContentButton as Element)

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: contentTabName }).getAttribute('data-state')).toBe(
        'active'
      )
      expect(document.activeElement?.getAttribute('name')).toBe('body')
    })
  })

  it('jumps to the basics tab and focuses title field from quality item action', async () => {
    renderPage()
    const basicsTabName = i18n.t('sectionTabs.basics', { ns: 'create' })
    const jumpToBasicsButton = screen
      .getAllByRole('button', { name: /빠르게|Jump to/ })
      .find((button) => button.textContent?.includes(basicsTabName))

    expect(jumpToBasicsButton).toBeTruthy()
    fireEvent.click(jumpToBasicsButton as Element)

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: basicsTabName }).getAttribute('data-state')).toBe(
        'active'
      )
      expect(document.activeElement?.getAttribute('name')).toBe('title')
    })
  })
})
