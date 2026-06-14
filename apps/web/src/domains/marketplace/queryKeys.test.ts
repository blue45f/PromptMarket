import { describe, expect, it } from 'vitest'

import { queryKeys, listingKey } from './queryKeys'

describe('queryKeys', () => {
  it('listings() with no args returns [listings, {}]', () => {
    expect(queryKeys.listings()).toEqual(['listings', {}])
  })

  it('listings() with params returns [listings, params]', () => {
    expect(queryKeys.listings({ type: 'PROMPT', sort: 'trending' })).toEqual([
      'listings',
      { type: 'PROMPT', sort: 'trending' },
    ])
  })

  it('listing() returns [listing, slug]', () => {
    expect(queryKeys.listing('my-slug')).toEqual(['listing', 'my-slug'])
  })

  it('related() returns [related, id]', () => {
    expect(queryKeys.related('id-1')).toEqual(['related', 'id-1'])
  })

  it('stats is [stats]', () => {
    expect(queryKeys.stats).toEqual(['stats'])
  })

  it('adminRevenueSettings is [admin, revenue, settings]', () => {
    expect(queryKeys.adminRevenueSettings).toEqual(['admin', 'revenue', 'settings'])
  })

  it('adminRevenueSettingsHistory is [admin, revenue, settings, history]', () => {
    expect(queryKeys.adminRevenueSettingsHistory).toEqual([
      'admin',
      'revenue',
      'settings',
      'history',
    ])
  })

  it('adminRevenueSummary includes limit', () => {
    expect(queryKeys.adminRevenueSummary(8)).toEqual(['admin', 'revenue', 'summary', { limit: 8 }])
  })

  it('me is [me]', () => {
    expect(queryKeys.me).toEqual(['me'])
  })

  it('mePurchases is [me, purchases]', () => {
    expect(queryKeys.mePurchases).toEqual(['me', 'purchases'])
  })

  it('reviews() returns [reviews, listingId]', () => {
    expect(queryKeys.reviews('listing-1')).toEqual(['reviews', 'listing-1'])
  })

  it('listingKey is the same reference as queryKeys.listing', () => {
    expect(listingKey).toBe(queryKeys.listing)
  })
})
