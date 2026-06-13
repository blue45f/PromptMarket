import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import CreateListingPage from './CreateListingPage'
import i18n from '@/i18n'

const createMutateAsync = vi.fn()
const toastSuccess = vi.fn()
const toastError = vi.fn()
const toastCustom = vi.fn()

vi.mock('@features/marketplace/queries', () => ({
  useCreateListing: vi.fn(() => ({ mutateAsync: createMutateAsync, isPending: false })),
  useListings: vi.fn(() => ({ data: { items: [] }, isPending: false })),
}))
vi.mock('react-hot-toast', () => ({
  default: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
    custom: (...args: unknown[]) => toastCustom(...args),
  },
}))
vi.mock('@hooks/usePageMeta', () => ({ usePageMeta: vi.fn() }))
vi.mock('@components/ModelPicker', () => ({
  default: ({
    value: _value,
    onChange: _onChange,
  }: {
    value: string[]
    onChange: (v: string[]) => void
  }) => <div data-testid="model-picker" />,
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
    createMutateAsync.mockResolvedValue({
      id: 'list-001',
      slug: 'my-first-listing',
      title: 'Published title sample',
      type: 'PROMPT',
      description: 'Published description that is intentionally long enough.',
      category: 'Coding',
      tags: ['tag1', 'tag2'],
      models: ['gpt-5'],
      difficulty: 'intermediate',
      license: 'MIT',
      version: '1.0.0',
      priceCents: 1200,
      coverEmoji: '✨',
      downloads: 0,
      author: { id: 'u1', username: 'you' },
      avgRating: 0,
      reviewCount: 0,
      technique: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    })
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

  it('toggles the preview panel between sidebar and full-width layout', () => {
    renderPage()
    const sidebarLabel = i18n.t('preview.layout.sidebar', { ns: 'create' })
    const fullLabel = i18n.t('preview.layout.full', { ns: 'create' })

    const sidebarButton = screen.getByRole('button', { name: sidebarLabel })
    const fullButton = screen.getByRole('button', { name: fullLabel })

    expect(sidebarButton.getAttribute('aria-pressed')).toBe('true')
    expect(fullButton.getAttribute('aria-pressed')).toBe('false')

    const form = screen.getByRole('form')
    expect(form.getAttribute('data-preview-layout')).toBe('sidebar')

    fireEvent.click(fullButton)

    expect(sidebarButton.getAttribute('aria-pressed')).toBe('false')
    expect(fullButton.getAttribute('aria-pressed')).toBe('true')
    expect(form.getAttribute('data-preview-layout')).toBe('full')
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

  it('renders a publish success toast containing preview content', async () => {
    renderPage()

    const titleInput = document.querySelector('input[name="title"]') as HTMLInputElement | null
    const descriptionInput = document.querySelector(
      'textarea[name="description"]'
    ) as HTMLTextAreaElement | null
    const contentTabName = i18n.t('sectionTabs.content', { ns: 'create' })
    const jumpToContentButton = screen
      .getAllByRole('button', { name: /빠르게|Jump to/ })
      .find((button) => button.textContent?.includes(contentTabName))

    expect(titleInput).toBeTruthy()
    expect(descriptionInput).toBeTruthy()
    expect(jumpToContentButton).toBeTruthy()

    fireEvent.change(titleInput!, { target: { value: 'My Published Listing Title' } })
    fireEvent.change(descriptionInput!, {
      target: { value: 'This is a valid description for publishing flow validation.' },
    })

    fireEvent.click(jumpToContentButton as Element)
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: contentTabName }).getAttribute('data-state')).toBe(
        'active'
      )
    })
    const bodyInput = screen.getByRole('textbox', {
      name: i18n.t('fields.body', { ns: 'create' }),
    }) as HTMLTextAreaElement
    expect(bodyInput).toBeTruthy()
    fireEvent.change(bodyInput!, {
      target: {
        value: '# Heading\n\nThis body has enough content to satisfy the minimum length check.',
      },
    })

    fireEvent.click(
      screen.getByRole('button', { name: i18n.t('submit.publish', { ns: 'create' }) })
    )

    await waitFor(() => {
      expect(createMutateAsync).toHaveBeenCalledTimes(1)
      expect(toastCustom).toHaveBeenCalledTimes(1)
      expect(toastSuccess).toHaveBeenCalledTimes(0)
    })

    const toastRenderer = toastCustom.mock.calls[0]?.[0] as
      | ((...args: unknown[]) => unknown)
      | undefined
    expect(typeof toastRenderer).toBe('function')

    if (typeof toastRenderer === 'function') {
      const toastNode = toastRenderer()
      const toastRoot = render(
        <div>
          {typeof toastNode === 'string' ? <span>{toastNode}</span> : (toastNode as ReactNode)}
        </div>
      )
      expect(toastRoot.getByText(i18n.t('toast.title', { ns: 'create' }))).toBeTruthy()
      expect(toastRoot.getByText('Published title sample')).toBeTruthy()
    }
  })
})
