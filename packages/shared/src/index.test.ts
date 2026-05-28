import { describe, expect, it } from 'vitest';
import {
  CreateListingSchema,
  LISTING_TYPE_META,
  ListingType,
  MODELS,
  MODEL_BY_SLUG,
  formatPrice,
  modelFamily,
  modelLabel,
  modelVendor,
  typeEmoji,
  typeLabel,
} from './index';

describe('formatPrice', () => {
  it('returns "Free" for 0 cents', () => {
    expect(formatPrice(0)).toBe('Free');
  });

  it('renders cents as dollars with 2 decimals', () => {
    expect(formatPrice(199)).toBe('$1.99');
    expect(formatPrice(12300)).toBe('$123.00');
    expect(formatPrice(1)).toBe('$0.01');
  });
});

describe('LISTING_TYPE_META', () => {
  it('has an entry for every ListingType enum value', () => {
    for (const t of ListingType.options) {
      expect(LISTING_TYPE_META).toHaveProperty(t);
      const meta = LISTING_TYPE_META[t];
      expect(meta.label).toBeTruthy();
      expect(meta.emoji).toBeTruthy();
      expect(meta.gradient).toContain('from-');
    }
  });

  it('typeLabel / typeEmoji read from the same map', () => {
    expect(typeLabel('PROMPT')).toBe(LISTING_TYPE_META.PROMPT.label);
    expect(typeEmoji('MCP_SERVER')).toBe(LISTING_TYPE_META.MCP_SERVER.emoji);
  });
});

describe('model registry', () => {
  it('every MODELS entry round-trips through MODEL_BY_SLUG', () => {
    for (const m of MODELS) {
      expect(MODEL_BY_SLUG[m.slug]?.label).toBe(m.label);
      expect(MODEL_BY_SLUG[m.slug]?.vendor).toBe(m.vendor);
      expect(MODEL_BY_SLUG[m.slug]?.family).toBe(m.family);
    }
  });

  it('helpers return safe fallbacks for unknown slugs', () => {
    expect(modelLabel('not-a-real-slug')).toBe('not-a-real-slug');
    expect(modelVendor('not-a-real-slug')).toBe('');
    expect(modelFamily('not-a-real-slug')).toBe('');
  });
});

describe('CreateListingSchema', () => {
  const valid = {
    title: 'Test prompt that is long enough',
    type: 'PROMPT' as const,
    description: 'A reasonably long description.',
    body: '# Body\n\nReasonably long markdown body for the listing.',
    category: 'Coding' as const,
    tags: 'agent,test',
    models: ['claude-opus-4-7'] as const,
    technique: 'chain-of-thought' as const,
    difficulty: 'intermediate' as const,
    license: 'MIT' as const,
    version: '1.0.0',
    priceCents: 199,
    coverEmoji: '✨',
  };

  it('accepts a well-formed payload', () => {
    const r = CreateListingSchema.safeParse(valid);
    expect(r.success).toBe(true);
  });

  it('rejects short titles', () => {
    const r = CreateListingSchema.safeParse({ ...valid, title: 'no' });
    expect(r.success).toBe(false);
  });

  it('rejects negative priceCents', () => {
    const r = CreateListingSchema.safeParse({ ...valid, priceCents: -1 });
    expect(r.success).toBe(false);
  });

  it('rejects malformed semver in version', () => {
    const r = CreateListingSchema.safeParse({ ...valid, version: '1.0' });
    expect(r.success).toBe(false);
  });

  it('rejects empty models array', () => {
    const r = CreateListingSchema.safeParse({ ...valid, models: [] });
    expect(r.success).toBe(false);
  });
});
