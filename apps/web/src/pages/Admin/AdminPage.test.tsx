import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
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
  ultraPremiumFeeBps: 1200,
  ultraPremiumFeePercent: 12,
  premiumThresholdCents: 3000,
  ultraPremiumThresholdCents: 10_000_00,
  platformFeeFloorCents: 0,
}

const summary = {
  totalPurchases: 12,
  paidPurchases: 10,
  freePurchases: 2,
  totalGrossCents: 15000,
  totalSellerNetCents: 12450,
  totalPlatformFeeCents: 2550,
  tierBreakdown: {
    freeOrders: 2,
    baseOrders: 0,
    premiumOrders: 10,
    ultraPremiumOrders: 0,
    freeGrossCents: 0,
    baseGrossCents: 0,
    premiumGrossCents: 15000,
    ultraPremiumGrossCents: 0,
    freePlatformFeeCents: 0,
    basePlatformFeeCents: 0,
    premiumPlatformFeeCents: 2550,
    ultraPremiumPlatformFeeCents: 0,
    freeSellerNetCents: 0,
    baseSellerNetCents: 0,
    premiumSellerNetCents: 12450,
    ultraPremiumSellerNetCents: 0,
  },
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
    key: 'platform_fee_ultra_premium_bps',
    value: 1200,
    updatedAt: null,
  },
  {
    key: 'platform_fee_ultra_premium_threshold_cents',
    value: 10_000_00,
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
      mutate: updateSpy,
      isPending: false,
    })
  })

  it('renders revenue summary and top creators', () => {
    render(withProviders(<AdminPage />))

    expect(screen.getByText('PromptMarket 수익 운영')).toBeTruthy()
    expect(screen.getByText('총 매출액')).toBeTruthy()
    expect(screen.getByText('플랫폼 수익률')).toBeTruthy()
    expect(screen.getByText('건당 평균 주문')).toBeTruthy()
    expect(screen.getByText('가격대별 수익 분해')).toBeTruthy()
    expect(screen.getAllByText('$150.00').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('가격대별 영향도')).toBeTruthy()
    expect(screen.getByText('월간 정책 영향 예측')).toBeTruthy()
    expect(screen.getByText('상위 판매자')).toBeTruthy()
    expect(screen.getByRole('link', { name: '@alice' })).toBeTruthy()
    expect(screen.getByText('판매량')).toBeTruthy()
    expect(screen.getByText('설정 이력')).toBeTruthy()
  })

  it('updates monthly forecast from order volume input', () => {
    render(withProviders(<AdminPage />))

    const monthlyInput = screen.getByLabelText('월 주문 수')
    const paidRatioInput = screen.getByLabelText('월간 유료 전환율 (%)')
    fireEvent.change(monthlyInput, { target: { value: '2' } })
    fireEvent.change(paidRatioInput, { target: { value: '100' } })

    const grossCard = screen.getByText('월간 총 매출').closest('div')
    expect(grossCard).toBeTruthy()
    expect(within(grossCard as HTMLElement).getByText('$15.00')).toBeTruthy()

    fireEvent.change(paidRatioInput, { target: { value: '0' } })
    expect(within(grossCard as HTMLElement).getByText('$0.00')).toBeTruthy()
  })

  it('recalculates forecast when scenario bucket amount and weight are edited', () => {
    render(withProviders(<AdminPage />))

    const monthlyInput = screen.getByLabelText('월 주문 수')
    const paidRatioInput = screen.getByLabelText('월간 유료 전환율 (%)')
    const firstAmountInput = screen.getByLabelText('구매금액 #1')
    const firstWeightInput = screen.getByLabelText('비중 #1')

    fireEvent.change(monthlyInput, { target: { value: '10' } })
    fireEvent.change(paidRatioInput, { target: { value: '100' } })

    const grossCard = screen.getByText('월간 총 매출').closest('div')
    expect(grossCard).toBeTruthy()
    const initialGross = within(grossCard as HTMLElement).getByText(/^\$\d+\.\d{2}$/).textContent
    expect(initialGross).toBe('$240.00')

    fireEvent.change(firstAmountInput, { target: { value: '10' } })
    fireEvent.change(firstWeightInput, { target: { value: '80' } })

    const updatedGross = within(grossCard as HTMLElement).getByText(/^\$\d+\.\d{2}$/).textContent
    expect(updatedGross).not.toBe(initialGross)
  })

  it('updates monthly platform delta when draft fee is changed', () => {
    render(withProviders(<AdminPage />))

    const baseFeeInput = screen.getByLabelText('기본 수수료 퍼센트 입력')
    const monthlyInput = screen.getByLabelText('월 주문 수')
    const paidRatioInput = screen.getByLabelText('월간 유료 전환율 (%)')

    fireEvent.change(baseFeeInput, { target: { value: '20' } })
    fireEvent.change(monthlyInput, { target: { value: '10' } })
    fireEvent.change(paidRatioInput, { target: { value: '100' } })

    const platformDeltaCard = screen.getByText('월간 플랫폼 수익 변동').closest('div')
    expect(platformDeltaCard).toBeTruthy()
    expect(within(platformDeltaCard as HTMLElement).getByText('+$2.70')).toBeTruthy()
  })

  it('calls mutate when fee changes and Save is clicked', () => {
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

  it('blocks saving and shows validation when premium threshold exceeds ultra premium threshold', () => {
    render(withProviders(<AdminPage />))

    fireEvent.change(screen.getByLabelText('프리미엄 임계 금액 입력'), {
      target: { value: '200' },
    })
    fireEvent.change(screen.getByLabelText('초고급 임계 금액 입력'), {
      target: { value: '100' },
    })

    const saveButton = screen.getByRole('button', { name: '저장' })
    expect(saveButton).toBeDisabled()
    expect(screen.getByText('프리미엄 임계값은 초고급 임계값보다 크면 안 됩니다.')).toBeTruthy()
    fireEvent.click(saveButton)
    expect(updateSpy).not.toHaveBeenCalled()
  })

  it('saves ultra premium fee settings when ultra values change', () => {
    updateSpy.mockResolvedValue({
      ...settings,
      ultraPremiumFeePercent: 11,
      ultraPremiumFeeBps: 1100,
      ultraPremiumThresholdCents: 300_00,
    })

    render(withProviders(<AdminPage />))

    fireEvent.change(screen.getByLabelText('초고급 수수료 퍼센트 입력'), {
      target: { value: '11' },
    })
    fireEvent.change(screen.getByLabelText('초고급 임계 금액 입력'), {
      target: { value: '300' },
    })
    fireEvent.click(screen.getByRole('button', { name: '저장' }))

    expect(updateSpy).toHaveBeenCalledWith({
      ultraPremiumFeeBps: 1100,
      ultraPremiumThresholdCents: 30000,
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
