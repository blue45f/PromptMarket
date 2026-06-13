import { describe, expect, it, vi } from 'vitest'

import { SeoController } from './seo.controller'

describe('SeoController', () => {
  it('proxies sitemap.xml to SeoService.sitemap()', async () => {
    const sitemap = vi.fn().mockResolvedValue('<urlset/>')
    const controller = new SeoController({ sitemap } as never)
    const xml = await controller.sitemap()
    expect(xml).toBe('<urlset/>')
    expect(sitemap).toHaveBeenCalledTimes(1)
  })

  it('propagates rejections from the service', async () => {
    const err = new Error('disk full')
    const controller = new SeoController({
      sitemap: vi.fn().mockRejectedValue(err),
    } as never)
    await expect(controller.sitemap()).rejects.toBe(err)
  })
})
