import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { SeoService } from './seo.service'

interface PrismaListingRow {
  slug: string
  updatedAt: Date
}
interface PrismaUserRow {
  username: string
  createdAt: Date
}

function makePrismaMock(listings: PrismaListingRow[], users: PrismaUserRow[]) {
  return {
    listing: { findMany: vi.fn().mockResolvedValue(listings) },
    user: { findMany: vi.fn().mockResolvedValue(users) },
  } as unknown as ConstructorParameters<typeof SeoService>[0]
}

const ORIGINAL_ENV = process.env.SITE_ORIGIN

beforeEach(() => {
  process.env.SITE_ORIGIN = 'https://promptmarket.example'
})

afterEach(() => {
  if (ORIGINAL_ENV === undefined) {
    delete process.env.SITE_ORIGIN
  } else {
    process.env.SITE_ORIGIN = ORIGINAL_ENV
  }
})

describe('SeoService.sitemap', () => {
  it('emits a urlset wrapper with all static + dynamic urls', async () => {
    const prisma = makePrismaMock(
      [{ slug: 'one', updatedAt: new Date('2026-05-01T00:00:00Z') }],
      [{ username: 'alex', createdAt: new Date('2026-04-01T00:00:00Z') }]
    )
    const svc = new SeoService(prisma)
    const xml = await svc.sitemap()
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true)
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
    expect(xml).toContain('https://promptmarket.example/')
    expect(xml).toContain('https://promptmarket.example/browse')
    expect(xml).toContain('https://promptmarket.example/listings/one')
    expect(xml).toContain('https://promptmarket.example/users/alex')
    expect(xml).toContain('2026-05-01T00:00:00.000Z')
  })

  it('escapes XML-special chars in slugs / usernames', async () => {
    const prisma = makePrismaMock(
      [{ slug: 'a&b<c>d"e', updatedAt: new Date('2026-05-01T00:00:00Z') }],
      [{ username: "o'reilly", createdAt: new Date('2026-04-01T00:00:00Z') }]
    )
    const svc = new SeoService(prisma)
    const xml = await svc.sitemap()
    expect(xml).toContain('a&amp;b&lt;c&gt;d&quot;e')
    expect(xml).toContain('o&apos;reilly')
    // Raw entities must NOT survive in the output.
    expect(xml).not.toMatch(/<loc>[^<]*&(?!amp|lt|gt|quot|apos)/)
  })

  it('falls back to the public hostname when SITE_ORIGIN is unset', async () => {
    delete process.env.SITE_ORIGIN
    const prisma = makePrismaMock([], [])
    const svc = new SeoService(prisma)
    const xml = await svc.sitemap()
    expect(xml).toContain('https://promptmarket.dev/')
  })
})
