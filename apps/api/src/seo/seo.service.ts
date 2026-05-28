import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const STATIC_PATHS: Array<{ path: string; changefreq: string; priority: string }> = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/browse', changefreq: 'hourly', priority: '0.9' },
  { path: '/browse?sort=trending', changefreq: 'hourly', priority: '0.8' },
  { path: '/browse?sort=newest', changefreq: 'hourly', priority: '0.8' },
  { path: '/browse?free=true', changefreq: 'daily', priority: '0.6' },
  { path: '/login', changefreq: 'monthly', priority: '0.3' },
  { path: '/register', changefreq: 'monthly', priority: '0.3' },
];

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

@Injectable()
export class SeoService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Public site origin used in sitemap absolute URLs. Configured via
   * SITE_ORIGIN; falls back to the production hostname so the sitemap is
   * always crawlable from search consoles even before deploy config lands.
   */
  private siteOrigin(): string {
    return process.env.SITE_ORIGIN ?? 'https://promptmarket.dev';
  }

  async sitemap(): Promise<string> {
    const origin = this.siteOrigin().replace(/\/$/, '');
    const [listings, users] = await Promise.all([
      this.prisma.listing.findMany({
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
        take: 5_000,
      }),
      this.prisma.user.findMany({
        select: { username: true, createdAt: true },
        take: 5_000,
      }),
    ]);

    const urls: string[] = [];

    for (const s of STATIC_PATHS) {
      urls.push(
        `<url><loc>${escapeXml(origin + s.path)}</loc><changefreq>${s.changefreq}</changefreq><priority>${s.priority}</priority></url>`,
      );
    }
    for (const l of listings) {
      urls.push(
        `<url><loc>${escapeXml(`${origin}/listings/${l.slug}`)}</loc><lastmod>${l.updatedAt.toISOString()}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`,
      );
    }
    for (const u of users) {
      urls.push(
        `<url><loc>${escapeXml(`${origin}/users/${u.username}`)}</loc><changefreq>weekly</changefreq><priority>0.5</priority></url>`,
      );
    }

    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
  }
}
