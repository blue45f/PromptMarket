import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  useAdminRevenueSettings,
  useAdminRevenueSettingsHistory,
  useAdminRevenueSummary,
  useUpdateRevenueSettings,
} from '@features/marketplace/queries'
import AdminPage from './AdminPage'

vi.mock('@features/marketplace/queries', () => ({
  useAdminRevenueSettings: vi.fn(),
  useAdminRevenueSettingsHistory: vi.fn(),
  useAdminRevenueSummary: vi.fn(),
  useUpdateRevenueSettings: vi.fn(),
}))

vi.mock('@hooks/usePageMeta', () => ({ usePageMeta: vi.fn() }))

const settings = {
  platformFeeBps: 1700,
  platformFeePercent: 17,
  premiumFeeBps: 1400,
  premiumFeePercent: 14,
  premiumThresholdCents: 3000,
  platformFeeFloorCents: 0,
}

const summary = {
  totalPurchases: 12,
  paidPurchases: 10,
  freePurchases: 2,
  totalGrossCents: 15000,
  totalSellerNetCents: 12450,
  totalPlatformFeeCents: 2550,
  topCreators: [
    {
      creatorId: 'c1',
      username: 'alice',
      listingCount: 3,
      salesCount: 10,
      grossRevenueCents: 15000,
      sellerNetCents: 12450,
      platformFeeCents: 2550,
    },
  ],
}

const settingsHistory = [
  {
    key: 'platform_fee_bps',
    value: 1700,
    updatedAt: '2026-06-01T00:00:00.000Z',
  },
  {
    key: 'platform_fee_premium_bps',
    value: 1400,
    updatedAt: null,
  },
  {
    key: 'platform_fee_premium_threshold_cents',
    value: 3000,
    updatedAt: null,
  },
  {
    key: 'platform_fee_floor_cents',
    value: 0,
    updatedAt: null,
  },
]

function withProviders(node: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <MemoryRouter>
      <QueryClientProvider client={qc}>{node}</QueryClientProvider>
    </MemoryRouter>
  )
}

describe('<AdminPage />', () => {
  let updateSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    updateSpy = vi.fn()
    ;(useAdminRevenueSettings as unknown as Mock).mockReturnValue({
      data: settings,
      isPending: false,
      error: null,
    })
    ;(useAdminRevenueSettingsHistory as unknown as Mock).mockReturnValue({
      data: settingsHistory,
      isPending: false,
      error: null,
    })
    ;(useAdminRevenueSummary as unknown as Mock).mockReturnValue({
      data: summary,
      isPending: false,
      error: null,
    })
    ;(useUpdateRevenueSettings as unknown as Mock).mockReturnValue({
      mutateAsync: updateSpy,
      isPending: false,
    })
  })

  it('renders revenue summary and top creators', () => {
    render(withProviders(<AdminPage />))

    expect(screen.getByText('PromptMarket 수익 운영')).toBeTruthy()
    expect(screen.getByText('총 매출액')).toBeTruthy()
    expect(screen.getAllByText('$150.00').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('상위 판매자')).toBeTruthy()
    expect(screen.getByRole('link', { name: '@alice' })).toBeTruthy()
    expect(screen.getByText('판매량')).toBeTruthy()
    expect(screen.getByText('설정 이력')).toBeTruthy()
  })

  it('calls mutateAsync when fee changes and Save is clicked', () => {
    updateSpy.mockResolvedValue({
      ...settings,
      platformFeePercent: 20,
      platformFeeBps: 2000,
      premiumFeePercent: 14,
      premiumFeeBps: 1400,
    })

    render(withProviders(<AdminPage />))

    fireEvent.change(screen.getByLabelText('기본 수수료 (%)'), { target: { value: '20' } })
    fireEvent.click(screen.getByRole('button', { name: '저장' }))

    expect(updateSpy).toHaveBeenCalledOnce()
    expect(updateSpy).toHaveBeenCalledWith({
      platformFeeBps: 2000,
    })
  })

  it('updates simulation projection from user input', () => {
    render(withProviders(<AdminPage />))

    const amountInput = screen.getByLabelText('예시 구매금액')
    const feeInput = screen.getByLabelText('기본 수수료 퍼센트 입력')

    fireEvent.change(amountInput, { target: { value: '10' } })
    fireEvent.change(feeInput, { target: { value: '20' } })

    expect(screen.getAllByText('17.00%').length).toBeGreaterThan(0)
    expect(screen.getAllByText('20.00%').length).toBeGreaterThan(0)
  })
})
