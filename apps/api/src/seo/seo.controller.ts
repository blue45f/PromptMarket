import { Controller, Get, Header } from '@nestjs/common'
import { ApiExcludeController } from '@nestjs/swagger'

import { SeoService } from './seo.service'

@ApiExcludeController()
@Controller('seo')
export class SeoController {
  constructor(private readonly seo: SeoService) {}

  @Get('sitemap.xml')
  @Header('Content-Type', 'application/xml; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=900')
  async sitemap(): Promise<string> {
    return this.seo.sitemap()
  }
}
