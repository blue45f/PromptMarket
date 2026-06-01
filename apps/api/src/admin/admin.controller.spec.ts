import { describe, expect, it, vi } from 'vitest'
import { AdminController } from './admin.controller'
import { AdminService } from './admin.service'

function makeController(overrides: Record<string, unknown> = {}) {
  const service = {
    getRevenueSettings: vi.fn().mockResolvedValue({
      platformFeeBps: 1700,
      platformFeePercent: 17,
      premiumFeeBps: 1400,
      premiumFeePercent: 14,
      premiumThresholdCents: 3000,
      platformFeeFloorCents: 0,
    }),
    getRevenueSettingsHistory: vi.fn().mockResolvedValue([
      {
        key: 'platform_fee_bps',
        value: 1700,
        updatedAt: '2026-06-01T12:00:00.000Z',
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
    ]),
    updateRevenueSettings: vi.fn().mockResolvedValue({
      platformFeeBps: 1700,
      platformFeePercent: 17,
      premiumFeeBps: 1400,
      premiumFeePercent: 14,
      premiumThresholdCents: 3000,
      platformFeeFloorCents: 0,
    }),
    getRevenueSummary: vi.fn().mockResolvedValue({
      totalPurchases: 0,
      paidPurchases: 0,
      freePurchases: 0,
      totalGrossCents: 0,
      totalSellerNetCents: 0,
      totalPlatformFeeCents: 0,
      topCreators: [],
    }),
    ...overrides,
  } as unknown as AdminService

  return {
    controller: new AdminController(service),
    service,
  }
}

describe('AdminController', () => {
  it('forwards the revenue settings request to the service', async () => {
    const { controller, service } = makeController()
    await controller.getRevenueSettings()
    expect(service.getRevenueSettings).toHaveBeenCalled()
  })

  it('forwards the update payload to service', async () => {
    const { controller, service } = makeController()
    await controller.updateRevenueSettings({ platformFeeBps: 1200 })
    expect(service.updateRevenueSettings).toHaveBeenCalledWith({ platformFeeBps: 1200 })
  })

  it('passes parsed summary limit to the service', async () => {
    const { controller, service } = makeController()
    await controller.getRevenueSummary('88')
    expect(service.getRevenueSummary).toHaveBeenCalledWith(88)
    await controller.getRevenueSummary('7')
    expect(service.getRevenueSummary).toHaveBeenLastCalledWith(7)
    await controller.getRevenueSummary('abc')
    expect(service.getRevenueSummary).toHaveBeenLastCalledWith(10)
    await controller.getRevenueSummary()
    expect(service.getRevenueSummary).toHaveBeenLastCalledWith(10)
  })

  it('forwards revenue settings history request to the service', async () => {
    const { controller, service } = makeController()
    await controller.getRevenueSettingsHistory()
    expect(service.getRevenueSettingsHistory).toHaveBeenCalled()
  })
})
